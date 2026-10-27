<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — ไทย

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> โครงการนี้เป็นฟอร์กอิสระที่ไม่เป็นทางการ ต้นฉบับ: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT) ไม่มีความเกี่ยวข้องกับ TimeTree, Inc.

**Security / ไทย:** ห้ามส่งข้อมูลเข้าสู่ระบบ TimeTree ในแชตหรือพรอมป์ต์ AI ให้จัดเก็บไว้เฉพาะในการตั้งค่าภายในเครื่องของไคลเอนต์ MCP

**Compatibility:** ยังไม่ได้ยืนยันไฟล์รุ่นเผยแพร่ของฟอร์กนี้ การเชื่อมต่อระยะไกลผ่าน ChatGPT บนมือถือ หรือความเข้ากันได้กับทุกไคลเอนต์

## สถานะฟีเจอร์ (27 ต.ค. 2026)

- **`main`:** ลงทะเบียนเครื่องมือ MCP แล้ว 29 รายการ ครอบคลุมปฏิทิน กิจกรรมซ้ำ บันทึก ข้อมูลเช็กลิสต์ ความคิดเห็น สมาชิก ป้ายกำกับ วันหยุด และประวัติล่าสุด
- **รุ่นเตรียมรวม ยังไม่เปิดใช้จริง:** เพิ่มเครื่องมืออ่านอย่างเดียว 3 รายการ (ค้นหาข้ามปฏิทิน เวลาว่าง ตรวจหากิจกรรมทับซ้อน) รวม 32 รายการ แม้การทดสอบก่อนหน้าผ่าน แต่ **การตรวจสอบความปลอดภัยโดยรวมไม่ผ่าน**
- **ต้นแบบที่ยังเรียกผ่าน MCP ไม่ได้:** ทดลองย้ายกำหนดการและส่งออก `.ics` โดยเน้นความเป็นส่วนตัว ยังไม่ยืนยันการเชื่อมต่อ ChatGPT มือถือโดยตรง การให้บริการหลายผู้ใช้สาธารณะ หรือการอนุญาตอย่างเป็นทางการจาก TimeTree


[Feature coverage / 機能対応表](https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/TIMETREE-FEATURE-COVERAGE-20261026.md) · [What-if prototype PR #21](https://github.com/ODU33104/TimeTree-MCP/pull/21) · [iCalendar export prototype PR #22](https://github.com/ODU33104/TimeTree-MCP/pull/22)

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
