import {createHash} from "node:crypto";
import path from "node:path";

// Select only a source set. The destination remains a fresh local cluster in every mode.
export function restoreInput(operationsDirectory: string, args: string[]) {
  if (args.length === 0 || (args.length === 1 && args[0] === "--recovery")) {
    return {directory: operationsDirectory, recovery: args.length === 1, imported: false};
  }
  if (args.length === 2 && args[0] === "--recovery-set" &&
      /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(args[1])) {
    return {directory: path.join(operationsDirectory, "recovery-input", args[1]), recovery: true, imported: true};
  }
  throw Error("no_target_arguments_allowed");
}

// Compare COPY records without retaining or reporting the original row values.
// Sorting row digests preserves duplicates and ignores physical heap ordering.
export function copyFingerprints(sql: string) {
  const result: Record<string, {rows: number; digest: string}> = {};
  let table: string | null = null;
  let header = "";
  let rows: string[] = [];
  for (const line of sql.split(/\r?\n/)) {
    if (table !== null) {
      if (line === "\\.") {
        result[table] = {
          rows: rows.length,
          digest: createHash("sha256").update(header + "\n" + rows.sort().join("\n")).digest("hex"),
        };
        table = null;
        rows = [];
      } else {
        rows.push(createHash("sha256").update(line).digest("hex"));
      }
      continue;
    }
    const match = line.match(/^COPY ((?:auth|private|public|supabase_migrations)\.[a-z_]+) \([^\r\n]+\) FROM stdin;$/);
    if (match) {
      if (Object.hasOwn(result, match[1])) throw Error("duplicate_copy_table");
      table = match[1];
      header = line;
    } else if (line.startsWith("COPY ")) {
      throw Error("unsupported_copy_table");
    }
  }
  if (table !== null || Object.keys(result).length === 0) throw Error("incomplete_copy_data");
  return result;
}

export function matchingCopies(source: ReturnType<typeof copyFingerprints>, restored: ReturnType<typeof copyFingerprints>) {
  const tables = Object.keys(source).sort();
  if (tables.join("\n") !== Object.keys(restored).sort().join("\n")) return false;
  return tables.every(table => source[table].rows === restored[table].rows && source[table].digest === restored[table].digest);
}

// No remote URL, database name, port, or destination path is accepted from users.
export function restoreTarget(directory: string, port: number) {
  if (!Number.isInteger(port) || port < 49152 || port > 65535) throw Error("invalid_drill_port");
  const normalized = directory.replaceAll("\\", "/");
  if (!/\/restore-drill-[a-f0-9-]{36}\/data$/.test(normalized)) throw Error("invalid_drill_directory");
  return {host: "127.0.0.1", port: String(port), database: "postgres", user: "meta_restore", directory};
}
