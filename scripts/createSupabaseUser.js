import { createClient } from "@supabase/supabase-js";

const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "USER_EMAIL",
  "USER_PASSWORD",
];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.USER_EMAIL;
const password = process.env.USER_PASSWORD;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const createUser = async () => {
  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError) {
    console.error("createUser error:", createError.message);
    process.exit(1);
  }

  console.log("createUser response:", {
    id: created.user?.id,
    email: created.user?.email,
    created_at: created.user?.created_at,
  });

  const { data: authUser, error: authError } = await supabase
    .from("auth.users")
    .select("id,email,created_at")
    .eq("email", email)
    .maybeSingle();

  if (authError) {
    console.error("auth.users lookup error:", authError.message);
    process.exit(1);
  }

  if (!authUser) {
    console.error("auth.users lookup: user not found");
    process.exit(1);
  }

  console.log("auth.users row:", authUser);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (profileError) {
    console.error("profiles lookup error:", profileError.message);
    process.exit(1);
  }

  if (!profile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      user_id: authUser.id,
    });

    if (insertError) {
      console.error("profiles insert error:", insertError.message);
      process.exit(1);
    }

    console.log("profiles row inserted");
    return;
  }

  console.log("profiles row already exists");
};

createUser().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
