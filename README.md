# Space – GitHub Action

This action allows to report build status for a commit to Space

## Basic Usage

```
- name: Report state to Space
  uses: ./
  with:
    space-org: [your-regustered-space-domain-name, e.g. mycompany]
    space-token: ${{ secrets.SPACE_TOKEN }}
    space-project-key: [project key where the repository is synced]
    state: [one of: scheduled, pending, ready_to_start, failed_to_start, running, failing, succeeded, terminated, failed, hanging]
```

## Arguments

The reqiored arguments are: space-org, space-token, space-project-key, state.
The other arguments are configured with either default or with the info taken from the context of the running GHA.

| Input            | Description    | Required   | Default   |
|------------      |-------         |-------     |-------    |
| `space-org`      | The domain of a registered Space organization. | Yes | - |
| `space-token`    | The token to authenticate with Space. | Yes | - |
| `space-project-key` | The key of a Space project where repository with the commit is linked. | Yes | - |
| `state`          | The state of the build (one of: scheduled, pending, ready_to_start, failed_to_start, running, failing, succeeded, terminated, failed, hanging). | Yes | 'successful' |
| `repository`     | The name of the repository in the Space project. | No | Taken from the action context |
| `revision`       | The SHA of a commit to be annotated. (default: taken from the action context). | No | Taken from the action context |
| `task-name`      | The name of the external check to be displayed in Space next to its state. | No | Taken from the action context |

## More Usage Examples:

The template if you want to sprinkle the state report around your pipeline.
It uses `if: success() / failure() / cancelled()` to catch and report the state:

```
name: GitHub Build Workflow

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - uses: ./.github/actions/space
        with:
          state: SCHEDULED

      # Some build steps here...
      - run: sleep 5

      - uses: ./.github/actions/space
        with:
          state: RUNNING

      # Some more build steps here
      - run: sleep 5

      - if: success()
        uses: ./.github/actions/space
        with:
          state: SUCCEEDED

      - if: failure()
        uses: ./.github/actions/space
        with:
          state: FAILED

      - if: cancelled()
        uses: ./.github/actions/space
        with:
          state: TERMINATED
```

## Dev GHA Setup

If you want to develop this GHA further:

1. :hammer_and_wrench: Install the dependencies

   ```bash
   npm install
   ```

1. :building_construction: Package the TypeScript for distribution

   ```bash
   npm run bundle
   ```

1. :white_check_mark: Run the tests

   ```bash
   $ npm test

   PASS  ./index.test.js
     ✓ throws invalid number (3ms)
     ✓ wait 500 ms (504ms)
     ✓ test runs (95ms)

   ...
   ```
