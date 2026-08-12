export const SPOKENLY_CLI = "spokenly";
export const REPLACEMENT_TIMING = "both" as const;

export type ExecFileResult = {
  stdout: string;
  stderr: string;
};

export type ExecFileFn = (
  file: string,
  args: readonly string[],
  options?: { timeout?: number },
) => Promise<ExecFileResult>;

export function buildAddReplacementArgs(original: string, replacement: string): string[] {
  return ["replacements", "add", original, replacement, "--timing", REPLACEMENT_TIMING];
}

export function mapSpokenlyCliError(error: unknown): string {
  if (error && typeof error === "object") {
    const err = error as { code?: string; message?: string; stderr?: string | Buffer };

    if (err.code === "ENOENT") {
      return "Spokenly CLI が見つかりません。Spokenly をインストールし、PATH に spokenly が含まれているか確認してください。";
    }

    const stderr =
      typeof err.stderr === "string"
        ? err.stderr.trim()
        : err.stderr instanceof Buffer
          ? err.stderr.toString("utf8").trim()
          : "";
    const message = err.message?.trim() ?? "";

    if (stderr) {
      return message ? `${message}\n${stderr}` : stderr;
    }

    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Spokenly CLI の実行に失敗しました。";
}

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const SPOKENLY_CLI_PATH_ENTRY = "/usr/local/bin";

const execFileAsync = promisify(execFile);

export function buildExecFilePath(existingPath?: string): string {
  const segments = (existingPath ?? "").split(":").filter(Boolean);

  if (segments.includes(SPOKENLY_CLI_PATH_ENTRY)) {
    return segments.join(":");
  }

  if (segments.length === 0) {
    return SPOKENLY_CLI_PATH_ENTRY;
  }

  return `${segments.join(":")}:${SPOKENLY_CLI_PATH_ENTRY}`;
}

export function buildExecFileEnv(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return {
    ...env,
    PATH: buildExecFilePath(env.PATH),
  };
}

export function createExecFileRunner(): ExecFileFn {
  return async (file, args, options) => {
    const { stdout, stderr } = await execFileAsync(file, [...args], {
      timeout: options?.timeout ?? 30_000,
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      env: buildExecFileEnv(),
    });

    return {
      stdout: typeof stdout === "string" ? stdout : "",
      stderr: typeof stderr === "string" ? stderr : "",
    };
  };
}

export async function runAddReplacement(
  execFileFn: ExecFileFn,
  original: string,
  replacement: string,
): Promise<ExecFileResult> {
  return execFileFn(SPOKENLY_CLI, buildAddReplacementArgs(original, replacement));
}
