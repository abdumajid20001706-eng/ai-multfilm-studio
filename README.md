# AI Multfilm Studio — haqiqiy MVP

Bu loyiha:
- g‘oyadan o‘zbekcha ssenariy yaratadi;
- har sahna uchun AI rasm yaratadi;
- har sahna uchun AI ovoz yaratadi;
- FFmpeg bo‘lsa, sahna rasmlaridan MP4 preview yig‘adi.

## Ishga tushirish
1. Node.js 20+ o‘rnating.
2. Papkada terminal oching.
3. `npm install`
4. `.env.example` nusxasini `.env` deb saqlang.
5. `.env` ichiga OpenAI API key kiriting.
6. `npm start`
7. Brauzerda `http://localhost:3000` ni oching.

## MP4
Serverga FFmpeg o‘rnating va PATH ga qo‘shing. Hozirgi MVP rasmlardan video preview yig‘adi; keyingi bosqichda real generativ video modelini ham ulash mumkin.

## Muhim
API key-ni frontend JavaScript ichiga yozmang. U faqat serverdagi `.env` da turishi kerak.
