# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "로그인" [level=3] [ref=e6]
      - generic [ref=e7]: AI AfterSchool에 오신 것을 환영합니다
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]: 이메일
        - textbox "이메일" [ref=e12]:
          - /placeholder: teacher@school.com
          - text: admin@test.com
      - generic [ref=e13]:
        - generic [ref=e14]: 비밀번호
        - textbox "비밀번호" [ref=e15]:
          - /placeholder: ••••••••
          - text: test1234
      - button "로그인 중..." [disabled]
    - link "비밀번호를 잊으셨나요?" [ref=e17] [cursor=pointer]:
      - /url: /reset-password
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e23] [cursor=pointer]:
    - img [ref=e24]
  - alert [ref=e27]
```