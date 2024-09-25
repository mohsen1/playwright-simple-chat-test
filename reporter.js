const stripAnsi = require("strip-ansi/index.js");
const CI = require("buildkite-test-collector/util/ci");
const uploadTestResults = require("buildkite-test-collector/util/uploadTestResults");
const Paths = require("buildkite-test-collector/util/paths");

const Network = require("buildkite-test-collector/util/network");
const Tracer = require("buildkite-test-collector/util/tracer");

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
    this._network = new Network();
    this._tracer = new Tracer();
    this._network.setup(this._tracer);
  }

  onBegin() {}

  onEnd() {
    this._tracer.finalize();
    this._network.teardown();
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

    const history = this._tracer.history();
    console.log("history", JSON.stringify(history, null, 2));

    this._testResults.push({
      id: test.id,
      name: test.title,
      scope: scope,
      location: location,
      file_name: fileName,
      result: this.analyticsResult(testResult.status),
      failure_reason: this.analyticsFailureReason(testResult),
      failure_expanded: this.analyticsFailureExpanded(testResult),
      history,
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
