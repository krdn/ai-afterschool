---
name: auto-save-issue
enabled: true
event: file
conditions:
  - field: file_path
    operator: ends_with
    pattern: .claude/save-issue-trigger.json
action: warn
---

## 🎯 GitHub Issue 자동 생성 트리거 감지

의미있는 커밋이 감지되었습니다. `/save-issue` 스킬을 실행하여 GitHub Issue를 등록해주세요.

**자동 실행:**
```bash
/save-issue
```

이 트리거 파일은 Issue 생성 후 자동으로 삭제됩니다.

**커밋 정보:**
- 커밋 해시: {{commit_hash}}
- 브랜치: {{branch}}
- 작성자: {{commit_author}}
