# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "로그인" [level=3] [ref=e6]
      - generic [ref=e7]: AI AfterSchool에 오신 것을 환영합니다
    - generic [ref=e9]:
      - generic [ref=e10]: 이메일 또는 비밀번호가 일치하지 않아요. 다시 확인해주세요.
      - generic [ref=e11]:
        - generic [ref=e12]: 이메일
        - textbox "이메일" [ref=e13]:
          - /placeholder: teacher@school.com
      - generic [ref=e14]:
        - generic [ref=e15]: 비밀번호
        - textbox "비밀번호" [ref=e16]:
          - /placeholder: ••••••••
      - button "로그인" [ref=e17]
    - link "비밀번호를 잊으셨나요?" [ref=e19] [cursor=pointer]:
      - /url: /reset-password
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e25] [cursor=pointer]:
    - img [ref=e26]
  - alert [ref=e29]
```