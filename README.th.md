<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — ไทย

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> โครงการนี้เป็นฟอร์กอิสระที่ไม่เป็นทางการ ต้นฉบับ: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT) ไม่มีความเกี่ยวข้องกับ TimeTree, Inc.

**Security / ไทย:** ห้ามส่งข้อมูลเข้าสู่ระบบ TimeTree ในแชตหรือพรอมป์ต์ AI ให้จัดเก็บไว้เฉพาะในการตั้งค่าภายในเครื่องของไคลเอนต์ MCP

**Compatibility:** ยังไม่ได้ยืนยันไฟล์รุ่นเผยแพร่ของฟอร์กนี้ การเชื่อมต่อระยะไกลผ่าน ChatGPT บนมือถือ หรือความเข้ากันได้กับทุกไคลเอนต์

## สถานะฟีเจอร์ (27 ต.ค. 2026)

- **เป้าหมายรุ่น v0.8.0 (`main` รวมรุ่นตัวเลือกสำหรับเผยแพร่): เครื่องมือ MCP 32 รายการ** ครอบคลุมปฏิทิน กิจกรรมซ้ำ บันทึก ข้อมูลเช็กลิสต์ ความคิดเห็น สมาชิก ป้ายกำกับ วันหยุด และประวัติล่าสุด เครื่องมือใหม่ 3 รายการเป็นแบบอ่านอย่างเดียว: `search_events_across_calendars` (ค้นหากิจกรรมข้ามปฏิทิน) `find_available_slots` (หาเวลาว่าง) และ `detect_event_conflicts` (ตรวจหากิจกรรมที่ทับซ้อน)
- **อยู่ระหว่างพัฒนา ยังไม่เผยแพร่ และยังใช้เป็นเครื่องมือ MCP ไม่ได้:** ทดลองย้ายกำหนดการ ส่งออก `.ics` โดยเน้นความเป็นส่วนตัว การป้องกันรายการซ้ำ สรุปการเข้าร่วม/เช็กลิสต์ และสรุปบนมือถือ ยังไม่ยืนยันการเชื่อมต่อ ChatGPT มือถือโดยตรง การให้บริการหลายผู้ใช้สาธารณะ หรือการอนุญาตอย่างเป็นทางการจาก TimeTree
- **การเข้าถึง:** ผ่าน stdio ยังเขียนข้อมูลได้เหมือนเดิม ตั้งตัวแปรสภาพแวดล้อม `TIMETREE_READ_ONLY=true` เพื่อให้เซิร์ฟเวอร์อ่านอย่างเดียว ส่วน HTTP ระยะไกลมีเพียงโมดูลนโยบาย ไม่มีเซิร์ฟเวอร์ที่รับการเชื่อมต่อ และไม่มีบริการระยะไกลสาธารณะ


## TimeTree MCP

อ่านปฏิทินและกิจกรรม สร้างหรือแก้ไขกิจกรรม จัดการความคิดเห็นและบันทึก และดูวันหยุด

## การติดตั้งและเอกสารทางเทคนิค

This localized quick-start provides the safe, verified-independent installation path. Full command reference and detailed instructions remain in [English README](README.md) and [MCP client documentation](docs/MCP_CLIENTS.md). This does **not** mean that all interfaces or date/time behavior are localized.

Requires Node.js 22+ and Git. Review repository contents and installation scripts before executing them.

```bash
git clone https://github.com/ODU33104/TimeTree-MCP.git
cd TimeTree-MCP
npm ci
npm run build
```

Configure your MCP client to launch `node /absolute/path/to/TimeTree-MCP/dist/index.js`. Set `TIMETREE_EMAIL` and `TIMETREE_PASSWORD` only in the client's local protected environment settings; never send credentials in AI prompts. See [MCP client setup](docs/MCP_CLIENTS.md) for the configuration format.

The project uses undocumented TimeTree web endpoints and may stop working when TimeTree changes them. Do not assume this fork has a downloadable release or a working remote/mobile integration.

## License and attribution

MIT: [LICENSE](LICENSE). Original authors and contributors: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP). Independent community fork; not endorsed by TimeTree, Inc. [Disclaimer](DISCLAIMER.md).
