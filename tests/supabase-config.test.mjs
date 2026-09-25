import assert from "node:assert/strict";
import test from "node:test";
import { getSupabaseConfig } from "../src/lib/supabase/config.ts";

test("configuração falha sem variáveis e rejeita chaves elevadas", () => {
  const original = { ...process.env };
  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    assert.throws(getSupabaseConfig, /Configure/);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    for (const value of ["sb_secret_TEST_ONLY", "eyJlegacy_TEST_ONLY"]) {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = value;
      assert.throws(getSupabaseConfig, /publishable/);
    }
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TEST_ONLY";
    assert.equal(getSupabaseConfig().url, "https://example.supabase.co");
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://example.supabase.co";
    assert.throws(getSupabaseConfig, /HTTPS/);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://user:password@example.supabase.co";
    assert.throws(getSupabaseConfig, /credenciais/);
  } finally {
    for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]) {
      if (original[name] === undefined) delete process.env[name];
      else process.env[name] = original[name];
    }
  }
});
