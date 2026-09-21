import assert from "node:assert/strict";
import { test } from "node:test";
import { ColdChainPollNotConfiguredError, getPollConfig } from "../lib/cold-chain/poll";

/**
 * مزوّد لا يدفع القراءات يُسحب منه. والسحب طريق خروج من شبكتنا، فحدوده
 * جزء من التصميم لا إضافة عليه.
 */

function withEnv(values: Record<string, string | undefined>, run: () => void) {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("السحب معطّل بأمان حتى يُضبط عنوانه ومحوّله", () => {
  withEnv({ COLD_CHAIN_POLL_URL: undefined, COLD_CHAIN_POLL_PROVIDER: undefined }, () => {
    assert.throws(() => getPollConfig(), ColdChainPollNotConfiguredError);
  });

  withEnv({ COLD_CHAIN_POLL_URL: "https://vendor.example/readings", COLD_CHAIN_POLL_PROVIDER: undefined }, () => {
    assert.throws(() => getPollConfig(), ColdChainPollNotConfiguredError, "عنوان بلا محوّل لا يكفي");
  });
});

test("لا سحب عبر HTTP — قراءات الأسطول ومواقعه لا تُنقل بنص صريح", () => {
  withEnv({ COLD_CHAIN_POLL_URL: "http://vendor.example/readings", COLD_CHAIN_POLL_PROVIDER: "acme" }, () => {
    assert.throws(() => getPollConfig(), ColdChainPollNotConfiguredError);
  });
});

test("عنوان تالف يُرفض ولا يُمرَّر إلى fetch", () => {
  withEnv({ COLD_CHAIN_POLL_URL: "not a url", COLD_CHAIN_POLL_PROVIDER: "acme" }, () => {
    assert.throws(() => getPollConfig(), ColdChainPollNotConfiguredError);
  });
});

test("إعداد صحيح يُقرأ، والتوكن اختياري", () => {
  withEnv(
    {
      COLD_CHAIN_POLL_URL: "https://vendor.example/readings",
      COLD_CHAIN_POLL_PROVIDER: "acme",
      COLD_CHAIN_POLL_TOKEN: undefined,
    },
    () => {
      const config = getPollConfig();
      assert.equal(config.providerId, "acme");
      assert.equal(config.token, null);
      assert.ok(config.url.startsWith("https://"));
    },
  );
});
