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
    this._history = {
      children: [
        {
          session: "top",
          children: [],
          detail: {},
          start_at: Date.now() - this._startTime,
        },
      ],
    };
  }

  async onEnd() {
    this._history.end_at = Date.now() - this._startTime;
    this._history.duration = this._history.end_at - this._history.start_at;

    console.log("Uploading test results to Buildkite Test Analytics");
    console.log("test results", JSON.stringify(this._testResults, null, 2));
    return await new Promise(async (resolve, reject) => {
      try {
        await uploadTestResults(
          this._testEnv,
          this._testResults,
          this._options,
          () => {
            console.log(
              "Done uploading test results to Buildkite Test Analytics"
            );
            resolve();
          }
        );
      } catch (error) {
        console.error(
          "Error uploading test results to Buildkite Test Analytics"
        );
        reject(error);
      }
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
          for (const request of payload) {
            this._history.children.push({
              session: "http",
              start_at: request.startTime - this._startTime,
              end_at: request.endTime - this._startTime,
              duration: request.endTime - request.startTime,
              detail: {
                method: request.method || "GET",
                url: request.url,
                status: request.status,
              },
            });
          }
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
      history: this._history,
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
