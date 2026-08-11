import bcrypt from "bcryptjs";

const pw = process.argv[2];
if (!pw) {
  console.error("Gunakan: node supabase/hash-password.mjs \"password\"");
  process.exit(1);
}
bcrypt.hash(pw, 10).then((hash) => {
  console.log(hash);
});
