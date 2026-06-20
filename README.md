# Creod Prompt Box

## 데이터 추가 방식

작업별 폴더를 `examples/<메인카테고리>/<세부카테고리>/<작업명>/` 안에 만듭니다.

예시:

```txt
examples/image/person/자동차 의인화 프롬프트/
├─ result.webp
└─ prompt.txt
```

선택 파일:

```txt
description.txt  짧은 설명
link.txt         외부 링크
```

## 사이트 데이터 생성

작업 폴더를 추가한 뒤 아래 명령을 실행합니다.

```bash
node scripts/build-data.js
```

그러면 `examples` 폴더를 스캔해서 `data/prompts.json`이 자동으로 갱신됩니다.

## 카테고리 폴더

```txt
examples/image/ad-poster
examples/image/person
examples/image/animal
examples/image/avatar
examples/image/cosplay
examples/image/magazine
examples/image/illustration
examples/image/infographic
examples/image/mockup
examples/image/daily
examples/image/wallpaper
examples/image/season
examples/image/thumbnail
examples/vba/excel
examples/vba/powerpoint
examples/appscript/google-sheets
examples/appscript/google-forms
examples/appscript/google-docs
examples/notebooklm/slides
```
