# collaboration-comment-thread-api

## ADDED Requirements

### Requirement: Collaboration proposal comment threads

The multiuser server SHALL allow project members with canon review access to add and read comment threads anchored to collaboration proposals.

#### Scenario: reviewer comments on proposal

- GIVEN a collaboration proposal exists in a project
- WHEN a reviewer posts a proposal comment
- THEN the response includes a comment thread anchored to that proposal
- AND the comment includes actor user id, body, and created timestamp
- AND the proposal status and apply requests are not changed

#### Scenario: project member reads proposal comments

- GIVEN a proposal has a comment thread
- WHEN a project member reads proposal comments
- THEN the response includes all comments for that proposal in created order
