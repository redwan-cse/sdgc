import { describe, expect, it } from "vitest";
import { createAnonClient, createServiceClient } from "./setup";

const anonClient = createAnonClient();
const serviceClient = createServiceClient();
const mailpitUrl = "http://127.0.0.1:54324";

interface MailpitRecipient {
  Address?: string;
  Name?: string;
}

interface MailpitMessageSummary {
  ID: string;
  To?: MailpitRecipient[];
}

interface MailpitMessageDetail {
  ID: string;
  HTML?: string;
  Text?: string;
}

async function clearMailpit() {
  try {
    await fetch(`${mailpitUrl}/api/v1/messages`, { method: "DELETE" });
  } catch {
    // ignore
  }
}

async function getLatestMailpitMessage(
  recipientEmail: string,
): Promise<MailpitMessageSummary | undefined> {
  const res = await fetch(`${mailpitUrl}/api/v1/messages`);
  if (!res.ok) throw new Error(`Mailpit error: ${res.statusText}`);
  const data = (await res.json()) as { messages?: MailpitMessageSummary[] };
  const messages = data.messages || [];
  return messages.find((m) =>
    m.To?.some((to) => to.Address?.toLowerCase() === recipientEmail.toLowerCase()),
  );
}

async function getMailpitMessageDetail(messageId: string): Promise<MailpitMessageDetail> {
  const res = await fetch(`${mailpitUrl}/api/v1/message/${messageId}`);
  if (!res.ok) throw new Error(`Mailpit detail error: ${res.statusText}`);
  return (await res.json()) as MailpitMessageDetail;
}

describe("R2: Signup, Recovery, and Profile Parity Regression Suite", () => {
  it("idempotently provisions profile, project interests, and pending membership for unconfirmed signup", async () => {
    const timestamp = Date.now();
    const email = `unconfirmed_${timestamp}@sdgc.local`;
    const username = `flower_lover_${timestamp}`;
    const password = "ValidPassword123!";

    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          first_name: "Rose",
          last_name: "Gardener",
          phone: "269-555-0111",
          secondary_phone: "269-555-0222",
          address_line1: "456 Blossom Lane",
          address_line2: "Suite 101",
          city: "Saugatuck",
          state: "MI",
          postal_code: "49453",
          birth_month: 6,
          birth_day: 15,
          spouse_name: "Basil Gardener",
          is_master_gardener: true,
          directory_opt_out: false,
          gardening_interests: "Heritage roses and pollinator pathways",
          volunteer_experience: "5 years leading youth garden workshops",
          project_interests: ["beautification", "garden_walk"],
        },
      },
    });

    expect(signUpError).toBeNull();
    expect(signUpData.user).not.toBeNull();
    const userId = signUpData.user?.id;
    if (!userId) throw new Error("Expected user to be created");

    // Verify profile is provisioned in DB even though session is unauthenticated
    const { data: profile, error: profError } = await serviceClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    expect(profError).toBeNull();
    expect(profile).not.toBeNull();
    expect(profile?.username).toBe(username);
    expect(profile?.first_name).toBe("Rose");
    expect(profile?.last_name).toBe("Gardener");
    expect(profile?.address_line1).toBe("456 Blossom Lane");
    expect(profile?.address_line2).toBe("Suite 101");
    expect(profile?.gardening_interests).toBe("Heritage roses and pollinator pathways");
    expect(profile?.volunteer_experience).toBe("5 years leading youth garden workshops");

    // Verify project interests
    const { data: interests, error: intError } = await serviceClient
      .from("profile_interests")
      .select("project_code")
      .eq("user_id", userId);

    expect(intError).toBeNull();
    const codes = interests?.map((i) => i.project_code) || [];
    expect(codes).toContain("beautification");
    expect(codes).toContain("garden_walk");

    // Verify pending membership
    const { data: memberships, error: memError } = await serviceClient
      .from("memberships")
      .select("status, notes")
      .eq("user_id", userId);

    expect(memError).toBeNull();
    expect(memberships?.length).toBe(1);
    expect(memberships?.[0]?.status).toBe("pending");
  });

  it("atomically updates profile and project interests including Address Line 2 and separate gardening/volunteer interests", async () => {
    const timestamp = Date.now();
    const email = `atomic_member_${timestamp}@sdgc.local`;
    const username = `atomic_user_${timestamp}`;

    const { data: userRecord } = await serviceClient.auth.admin.createUser({
      email,
      password: "TestPassword123!",
      email_confirm: true,
      user_metadata: {
        username,
        first_name: "OriginalFirst",
        last_name: "OriginalLast",
      },
    });
    const userId = userRecord.user?.id;
    if (!userId) throw new Error("Expected user to be created");

    // Login as this user
    const userClient = createAnonClient();
    const { data: authSession } = await userClient.auth.signInWithPassword({
      email,
      password: "TestPassword123!",
    });
    expect(authSession.session).not.toBeNull();

    // Call atomic RPC update_member_profile
    const { error: rpcError } = await userClient.rpc("update_member_profile", {
      p_first_name: "UpdatedFirst",
      p_last_name: "UpdatedLast",
      p_spouse_name: "Spouse Name",
      p_phone: "269-555-0333",
      p_secondary_phone: "269-555-0444",
      p_address_line1: "789 Lakeshore Drive",
      p_address_line2: "Apt 2B",
      p_city: "Douglas",
      p_state: "MI",
      p_postal_code: "49406",
      p_birth_month: 8,
      p_birth_day: 22,
      p_is_master_gardener: true,
      p_directory_opt_out: false,
      p_gardening_interests: "Heirloom vegetables and pollinator borders",
      p_volunteer_experience: "Master gardener advisor and school volunteer",
      p_project_interests: ["beautification", "charitable"],
    });

    expect(rpcError).toBeNull();

    // Read back via serviceClient
    const { data: updatedProfile } = await serviceClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    expect(updatedProfile?.first_name).toBe("UpdatedFirst");
    expect(updatedProfile?.address_line2).toBe("Apt 2B");
    expect(updatedProfile?.gardening_interests).toBe("Heirloom vegetables and pollinator borders");
    expect(updatedProfile?.volunteer_experience).toBe(
      "Master gardener advisor and school volunteer",
    );

    // Read back profile_interests
    const { data: interests } = await serviceClient
      .from("profile_interests")
      .select("project_code")
      .eq("user_id", userId);

    const codes = interests?.map((i) => i.project_code) || [];
    expect(codes.sort()).toEqual(["beautification", "charitable"].sort());
  });

  it("exact username lookup avoids SQL ILIKE wildcard underscore bug and enforces case normalization", async () => {
    const timestamp = Date.now();
    const emailA = `user_a_${timestamp}@sdgc.local`;
    const emailB = `user_b_${timestamp}@sdgc.local`;
    const usernameA = `test_bot_${timestamp}`;
    const usernameWildcardProbe = `testXbot_${timestamp}`;

    // Create user A with underscore in username
    const { data: userA } = await serviceClient.auth.admin.createUser({
      email: emailA,
      password: "TestPassword123!",
      email_confirm: true,
      user_metadata: {
        username: usernameA,
        first_name: "Alice",
        last_name: "Underscore",
      },
    });
    expect(userA.user).not.toBeNull();
    const userAId = userA.user?.id;
    if (!userAId) throw new Error("Expected userA to be created");

    // Create user B with literal char replacing underscore
    const { data: userB } = await serviceClient.auth.admin.createUser({
      email: emailB,
      password: "TestPassword123!",
      email_confirm: true,
      user_metadata: {
        username: usernameWildcardProbe,
        first_name: "Bob",
        last_name: "Probe",
      },
    });
    expect(userB.user).not.toBeNull();
    const userBId = userB.user?.id;
    if (!userBId) throw new Error("Expected userB to be created");

    // Ensure profiles exist
    await serviceClient.from("profiles").upsert([
      {
        id: userAId,
        username: usernameA.toLowerCase(),
        first_name: "Alice",
        last_name: "Underscore",
      },
      {
        id: userBId,
        username: usernameWildcardProbe.toLowerCase(),
        first_name: "Bob",
        last_name: "Probe",
      },
    ]);

    // Querying by usernameA should match ONLY Alice, NOT Bob
    const { data: matchA } = await serviceClient
      .from("profiles")
      .select("id, username")
      .eq("username", usernameA.toLowerCase());

    expect(matchA?.length).toBe(1);
    expect(matchA?.[0]?.username).toBe(usernameA.toLowerCase());

    // Querying by usernameWildcardProbe should match ONLY Bob, NOT Alice
    const { data: matchB } = await serviceClient
      .from("profiles")
      .select("id, username")
      .eq("username", usernameWildcardProbe.toLowerCase());

    expect(matchB?.length).toBe(1);
    expect(matchB?.[0]?.username).toBe(usernameWildcardProbe.toLowerCase());
  });

  it("end-to-end signup confirmation and password recovery via local Mailpit capture", async () => {
    await clearMailpit();

    const timestamp = Date.now();
    const email = `flow_member_${timestamp}@sdgc.local`;
    const username = `flow_user_${timestamp}`;
    const initialPassword = "InitialPassword123!";
    const newPassword = "NewSecurePassword456!";

    // 1. Sign up user
    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email,
      password: initialPassword,
      options: {
        emailRedirectTo: "http://127.0.0.1:3000/auth/confirm?next=/profile",
        data: {
          username,
          first_name: "Flow",
          last_name: "Tester",
        },
      },
    });
    expect(signUpError).toBeNull();
    expect(signUpData.user).not.toBeNull();

    // 2. Fetch confirmation email from Mailpit
    const confirmMsgSummary = await getLatestMailpitMessage(email);
    expect(confirmMsgSummary).toBeDefined();
    if (!confirmMsgSummary?.ID) throw new Error("Expected confirmation email summary ID");

    const confirmMsgDetail = await getMailpitMessageDetail(confirmMsgSummary.ID);
    const emailHtml = confirmMsgDetail.HTML || confirmMsgDetail.Text || "";

    // Extract token or confirmation link
    const tokenMatch =
      emailHtml.match(/[?&]token=([a-zA-Z0-9_-]+)/) ||
      emailHtml.match(/token_hash=([a-zA-Z0-9_-]+)/);
    expect(tokenMatch).not.toBeNull();
    const token = tokenMatch?.[1];
    if (!token) throw new Error("Expected confirmation token");

    // 3. Verify OTP as signup
    const userClient = createAnonClient();

    const { data: verifyData, error: verifyError } = await userClient.auth.verifyOtp({
      token_hash: token,
      type: "signup",
    });
    expect(verifyError).toBeNull();
    expect(verifyData.session).not.toBeNull();

    // 4. Request password recovery
    await clearMailpit();
    const { error: resetReqError } = await anonClient.auth.resetPasswordForEmail(email, {
      redirectTo: "http://127.0.0.1:3000/auth/confirm?next=/reset-password",
    });
    expect(resetReqError).toBeNull();

    // 5. Fetch recovery email from Mailpit
    const recoveryMsgSummary = await getLatestMailpitMessage(email);
    expect(recoveryMsgSummary).toBeDefined();
    if (!recoveryMsgSummary?.ID) throw new Error("Expected recovery email summary ID");

    const recoveryMsgDetail = await getMailpitMessageDetail(recoveryMsgSummary.ID);
    const recoveryHtml = recoveryMsgDetail.HTML || recoveryMsgDetail.Text || "";

    const recoveryTokenMatch =
      recoveryHtml.match(/[?&]token=([a-zA-Z0-9_-]+)/) ||
      recoveryHtml.match(/token_hash=([a-zA-Z0-9_-]+)/);
    expect(recoveryTokenMatch).not.toBeNull();
    const recoveryToken = recoveryTokenMatch?.[1];
    if (!recoveryToken) throw new Error("Expected recovery token");

    // 6. Verify OTP as recovery to establish recovery session
    const recoveryClient = createAnonClient();

    const { data: recSessionData, error: recVerifyError } = await recoveryClient.auth.verifyOtp({
      token_hash: recoveryToken,
      type: "recovery",
    });
    expect(recVerifyError).toBeNull();
    expect(recSessionData.session).not.toBeNull();

    // 7. Update password using the authenticated recovery session
    const { error: updatePassError } = await recoveryClient.auth.updateUser({
      password: newPassword,
    });
    expect(updatePassError).toBeNull();

    // 8. Verify login works with the new password
    const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
      email,
      password: newPassword,
    });
    expect(loginError).toBeNull();
    expect(loginData.session).not.toBeNull();
  });
});
