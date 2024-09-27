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
    this._historyTop = {
      children: [],
      detail: {},
      start_at: Date.now() - this._startTime,
    };
    this._history = {
      children: [],
    };
  }

  async onEnd() {
    this._historyTop.end_at = Date.now() - this._startTime;
    this._historyTop.duration =
      this._historyTop.end_at - this._historyTop.start_at;
    this._historyTop.children.unshift(this._history);

    console.log("Uploading test results to Buildkite Test Analytics");
    await new Promise(async (resolve, reject) => {
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
    console.log("Completed the promise");
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
    const children = [];
      
    testResult.attachments.forEach((attachment) => {
      if (attachment.name === "network-requests") {
        const body = attachment.body?.toString("utf-8");
        if (body) {
          const payload = JSON.parse(body);
          for (const request of payload) {
            children.push({
              section: "http",
              start_at: request.startTime - this._startTime,
              end_at: request.endTime - this._startTime,
              duration: request.endTime - request.startTime,
              detail: {
                method: request.method || "GET",
                url: request.url,
                lib: 'playwright'
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
      history: {
        'section': 'top',
        'start_at': testResult.startTime.getTime(),
        'duration': testResult.duration / 1000,
        'children': children
      }
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
