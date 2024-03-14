import * as core from '@actions/core'
import * as github from '@actions/github'
import { HttpClient } from '@actions/http-client'

enum SpaceExecutionStatusState {
  SCHEDULED = 'SCHEDULED',
  PENDING = 'PENDING',
  READY_TO_START = 'READY_TO_START',
  FAILED_TO_START = 'FAILED_TO_START',
  RUNNING = 'RUNNING',
  FAILING = 'FAILING',
  SUCCEEDED = 'SUCCEEDED',
  TERMINATED = 'TERMINATED',
  FAILED = 'FAILED',
  HANGING = 'HANGING'
}

function validateState(input: string): input is SpaceExecutionStatusState {
  return Object.values(SpaceExecutionStatusState).includes(
    input.toUpperCase() as SpaceExecutionStatusState
  )
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Parsed GHA parameters
    const spaceOrg: string = core.getInput('space-org', { required: true })
    const spaceToken: string = core.getInput('space-token', { required: true })
    const spaceProjectKey: string = core.getInput('space-project-key', {
      required: true
    })
    const stateInput: string = core.getInput('state', { required: true })
    if (!validateState(stateInput)) {
      core.setFailed(
        `Invalid state: ${stateInput}. Should be one of ${Object.values(SpaceExecutionStatusState).join(', ')}`
      )
      return
    }
    const state = stateInput.toUpperCase() as SpaceExecutionStatusState

    const revision =
      core.getInput('revision', { required: false }) || github.context.sha
    const repositoryName =
      core.getInput('repository', { required: false }) ||
      github.context.repo.repo
    const taskName =
      core.getInput('task-name', { required: false }) ||
      `${github.context.workflow} / ${github.context.job}`
    const runId = github.context.runId

    // Perform the request
    const requestUrl = `https://${spaceOrg}.jetbrains.space/api/http/projects/key:${spaceProjectKey}/repositories/${repositoryName}/revisions/${revision}/external-checks`
    core.debug(`Request URL is ${requestUrl}`)

    const runUrl = `${github.context.serverUrl}/${github.context.repo.owner}/${repositoryName}/actions/runs/${runId}`
    const requestObject = {
      executionStatus: state,
      url: runUrl,
      externalServiceName: 'GitHub Actions',
      taskName: taskName,
      taskId: runId
    }
    core.debug(`Request object: ${JSON.stringify(requestObject, null, 2)}`)

    const httpClient = new HttpClient('github-actions-build-status-reporter')
    const response = await httpClient.postJson(requestUrl, requestObject, {
      Authorization: `Bearer ${spaceToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    })

    if (response.statusCode < 200 || response.statusCode > 299) {
      throw new Error(`Server responded with ${response.statusCode}`)
    }

    core.info('Successfully reported build status to JetBrains Space')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}
