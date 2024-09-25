const stripAnsi = require("strip-ansi/index.js");
const CI = require("buildkite-test-collector/util/ci");
const uploadTestResults = require("buildkite-test-collector/util/uploadTestResults");
const Paths = require("buildkite-test-collector/util/paths");

/**
 * JSDoc Imports
 *
 * @typedef {import('@playwright/test/reporter').FullConfig} FullConfig
 * @typedef {import('@playwright/test/reporter').FullResult} FullResult
 * @typedef {import('@playwright/test/reporter').Reporter} Reporter
 * @typedef {import('@playwright/test/reporter').Suite} Suite
 * @typedef {import('@playwright/test/reporter').TestCase} TestCase
 * @typedef {import('@playwright/test/reporter').TestResult} TestResult
 */

/**
 * A playwright reporter that uploads test results to Buildkite Test Analytics
 *
 * @implements {import('@playwright/test/reporter').Reporter}
 */
class PlaywrightBuildkiteAnalyticsReporter {
  constructor(options) {
    this._testResults = [];
    this._testEnv = new CI().env();
    this._options = options;
    this._paths = new Paths(
      { cwd: process.cwd() },
      this._testEnv.location_prefix
    );
    this._startTime = Date.now();
  }

  onBegin() {
    this._history = [
      {
        session: "top",
        children: [],
        detail: {},
        start_at: Date.now() - this._startTime,
      },
    ];
  }

  onEnd() {
    // todo: clean up
    this._history[0].end_at = Date.now() - this._startTime;
    this._history[0].detail.duration =
      this._history[0].end_at - this._history[0].start_at;

    return new Promise((resolve) => {
      uploadTestResults(
        this._testEnv,
        this._testResults,
        this._options,
        resolve
      );
    });
  }

  onTestBegin() {}

  /**
   *
   * @param {TestCase} test
   * @param {TestResult} testResult
   */
  onTestEnd(test, testResult) {
    const scope = test.titlePath().join(" ");
    const fileName = this._paths.prefixTestPath(test.location.file);
    const location = [fileName, test.location.line, test.location.column].join(
      ":"
    );
    testResult.attachments.forEach((attachment) => {
      if (attachment.name === "network-requests") {
        const body = attachment.body?.toString("utf-8");
        if (body) {
          const payload = JSON.parse(body);
          this._history[0].children.push({
            session: "http",
            start_at: payload.startTime - this._startTime,
            end_at: payload.endTime - this._startTime,
            duration: payload.endTime - payload.startTime,
            detail: {
              method: payload.method?.toUpperCase() || "GET",
              url: payload.url,
              status: payload.status,
            },
          });
        }
      }
    });

    this._testResults.push({
      id: test.id,
      name: test.title,
      scope: scope,
      location: location,
      file_name: fileName,
      result: this.analyticsResult(testResult.status),
      failure_reason: this.analyticsFailureReason(testResult),
      failure_expanded: this.analyticsFailureExpanded(testResult),
    });
  }

  analyticsResult(status) {
    // Playwright test statuses:
    // - failed
    // - interrupted
    // - passed
    // - skipped
    // - timedOut
    //
    // Buildkite Test Analytics execution results:
    // - failed
    // - passed
    // - pending
    // - skipped
    // - unknown
    return {
      failed: "failed",
      interrupted: "unknown",
      passed: "passed",
      skipped: "skipped",
      timedOut: "failed",
    }[status];
  }

  /**
   *
   * @param {TestResult} testResult
   */
  analyticsFailureReason(testResult) {
    if (testResult.error == undefined) return "";

    const reason = stripAnsi(testResult.error.message).split("\n")[0];

    return reason;
  }

  /**
   *
   * @param {TestResult} testResult
   */
  analyticsFailureExpanded(testResult) {
    let expandedErrors = [];

    if (testResult.errors) {
      for (const error of testResult.errors) {
        if (error.stack) {
          const stack = stripAnsi(error.stack).split("\n");
          const snippet = stripAnsi(error.snippet)?.split("\n") || [];
          expandedErrors = expandedErrors.concat(stack, snippet);
        } else if (error.message) {
          const message = stripAnsi(error.message).split("\n");
          expandedErrors = expandedErrors.concat(message);
        }
      }
    }

    return [
      {
        expanded: expandedErrors,
      },
    ];
  }
}

module.exports = PlaywrightBuildkiteAnalyticsReporter;
