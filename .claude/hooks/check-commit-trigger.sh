#!/bin/bash
# Check for new commits and trigger save-issue if needed

TRIGGER_FILE=".claude/last_commit_check"
CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null)

if [ ! -f "$TRIGGER_FILE" ]; then
    # First run - save current commit
    echo "$CURRENT_COMMIT" > "$TRIGGER_FILE"
    exit 0
fi

LAST_CHECKED_COMMIT=$(cat "$TRIGGER_FILE")

# Check if there's a new commit
if [ "$CURRENT_COMMIT" != "$LAST_CHECKED_COMMIT" ]; then
    # New commit detected!
    COMMIT_MSG=$(git log -1 --pretty=%B)

    # Check if this is a meaningful commit
    if echo "$COMMIT_MSG" | grep -qiE "feat|fix|refactor|docs|phase|단계|추가|수정|구현"; then
        # Skip trivial commits
        if ! echo "$COMMIT_MSG" | grep -qiE "typo|format|style|wip|오타|포맷"; then
            # Create trigger for save-issue
            echo "$CURRENT_COMMIT" > "$TRIGGER_FILE"
            echo "AUTO_SAVE_ISSUE=1" > .claude/auto-save-issue-trigger
            echo "LAST_COMMIT=$CURRENT_COMMIT" >> .claude/auto-save-issue-trigger
            echo "COMMIT_MSG=$(echo "$COMMIT_MSG" | head -1)" >> .claude/auto-save-issue-trigger
        fi
    fi
fi
