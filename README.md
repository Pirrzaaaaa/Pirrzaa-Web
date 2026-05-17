# Ryuuzaa MD

WhatsApp bot ESM berbasis [`@blckrose/baileys`](https://www.npmjs.com/package/@blckrose/baileys), login pakai **pairing code `RYUUZAAA`**, dengan **plugin loader** + hot-reload, sistem **limit/cooldown**, dan `case.js` sebagai sampingan.

## Persyaratan

- Node.js >= 20
- WhatsApp di HP

## Instalasi

```bash
cd wa-bot-blckrose
npm install
```

## Menjalankan

```bash
npm start
```

Saat pertama kali jalan, terminal akan menampilkan kode pairing format `RYUU-ZAAA`. Buka WhatsApp di HP → **Linked Devices** → **Link a Device** → **Link with phone number** → masukkan kode tersebut.

> Atur `config.pairingNumber` di `config.js` untuk skip prompt nomor di terminal. Atau set `config.usePairingCode = false` untuk kembali pakai QR.

## Struktur

```
wa-bot-blckrose/
├── index.js                          # entry point: socket, pairing, koneksi
├── handler.js                        # message handler: parse, guard, dispatch
├── case.js                           # SAMPINGAN: non-command & fallback
├── config.js                         # botName, prefix, owner, pairing, limit
├── lib/
│   ├── ryuuzaa-helper.js             # parser command, util format
│   ├── ryuuzaa-pairing.js            # request pairing code RYUUZAAA
│   ├── ryuuzaa-limiter.js            # limit, cooldown, premium
│   └── ryuuzaa-plugins-loader.js     # PluginManager + hot-reload
└── plugins/
    ├── general/  (menu, ping, runtime, info, limit)
    ├── tools/    (echo, sticker)
    ├── fun/      (dadu)
    └── owner/    (broadcast, reload, setlimit)
```

## Format Plugin (LENGKAP)

Setiap file di `./plugins/**/*.js` `export default` objek dengan field berikut:

```js
export default {
  name:        "echo",                    // identitas unik plugin
  command:     ["echo"],                  // command utama (string | string[])
  alias:       ["say"],                   // alias tambahan
  category:    "tools",                   // grouping di .menu
  description: "Bot ulangi teks",         // deskripsi singkat
  usage:       "<teks>",                  // pola argumen
  example:     ".echo halo dunia",        // contoh
  tags:        ["text", "util"],          // tag bebas

  // ===== Akses =====
  owner:    false,   // hanya owner
  admin:    false,   // hanya admin grup (untuk fitur grup)
  botAdmin: false,   // bot harus admin
  group:    false,   // hanya di grup
  private:  false,   // hanya di private chat
  premium:  false,   // hanya premium user
  register: false,   // hanya user terdaftar
  nsfw:     false,   // konten dewasa

  // ===== Quota =====
  limit:    1,       // mengurangi limit user (0 = tanpa limit)
  cooldown: 2000,    // jeda antar pemakaian per user (ms)

  // ===== Visibilitas =====
  hidden:   false,   // sembunyikan dari .menu
  disabled: false,   // matikan plugin

  async handler(ctx) {
    await ctx.reply("hi");
  },
};
```

Field minimum: `command` + `handler`. Sisanya opsional.

### Hot-reload

Loader memantau folder `./plugins/` setiap 1.5 detik. File baru / diedit / dihapus langsung dimuat ulang tanpa restart. Atau panggil `.reload` (owner only) untuk paksa reload.

## ctx Yang Dikirim ke `handler(ctx)`

| Field       | Tipe         | Keterangan                                    |
| ----------- | ------------ | --------------------------------------------- |
| `sock`      | `WASocket`   | instance Baileys                              |
| `msg`       | `proto`      | objek pesan mentah                            |
| `from`      | `string`     | jid chat (group/private)                      |
| `sender`    | `string`     | jid pengirim                                  |
| `pushName`  | `string`     | nama user                                     |
| `isGroup`   | `boolean`    | apakah grup                                   |
| `isOwner`   | `boolean`    | apakah pengirim owner                         |
| `isPremium` | `boolean`    | apakah pengirim premium                       |
| `prefix`    | `string`     | prefix yang dipakai (`.`, `!`, atau `/`)      |
| `command`   | `string`     | nama command lowercase                        |
| `args`      | `string[]`   | argumen                                       |
| `text`      | `string`     | args di-join spasi                            |
| `body`      | `string`     | teks mentah                                   |
| `reply`     | `function`   | shortcut: `reply(text)` atau `reply({...})`   |
| `plugins`   | `PluginMgr`  | akses plugin manager                          |
| `limiter`   | `Limiter`    | API limit/cooldown/premium                    |
| `config`    | `object`     | konfigurasi bot                               |

## Perintah Bawaan

| Perintah                | Kategori | Limit | Deskripsi                       |
| ----------------------- | -------- | ----- | ------------------------------- |
| `.menu` / `.help`       | general  | 0     | Daftar perintah                 |
| `.ping`                 | general  | 0     | Cek latency                     |
| `.runtime`              | general  | 0     | Lama bot menyala                |
| `.info`                 | general  | 0     | Info Node, OS, RAM, jumlah cmd  |
| `.limit`                | general  | 0     | Cek sisa limit                  |
| `.echo <teks>`          | tools    | 1     | Bot membalas teks               |
| `.sticker` (reply foto) | tools    | 2     | Placeholder stiker              |
| `.dadu`                 | fun      | 1     | Lempar dadu 1-6                 |
| `.broadcast <teks>`     | owner    | 0     | Broadcast (owner)               |
| `.reload`               | owner    | 0     | Reload semua plugin             |
| `.setlimit <jumlah>`    | owner    | 0     | Atur limit user                 |

## case.js (sampingan)

Dipanggil ketika:

1. **Pesan non-command** (tanpa prefix) — auto-reply: `p`, `assalamualaikum`, `bot?`.
2. **Command tak dikenal** — fallback dengan hint `.menu`, plus hidden alias `hai`/`hi`/`halo`/`owner`.

## Konfigurasi (`config.js`)

```js
botName:        "Ryuuzaa MD",
ownerName:      "Ryuuzaa",
owner:          ["6281234567890"],
prefix:         [".", "!", "/"],
usePairingCode: true,
pairingNumber:  "",          // kosong = diminta lewat prompt terminal
pairingCode:    "RYUUZAAA",  // 8 char alfanumerik
sessionDir:     "./session",
hotReload:      true,
defaultLimit:   30,
```

## Catatan

- Ganti nomor owner di `config.js` sebelum dipakai.
- Hapus folder `session/` jika ingin login dengan akun lain.
- Gunakan dengan tanggung jawab; mengikuti TOS WhatsApp adalah tanggung jawab pengguna.
