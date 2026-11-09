# Third-Party Notices

YaniCloud includes the third-party software listed below. Each component remains
under its own license; the AGPL-3.0 license of YaniCloud does not change that.

This file covers production dependencies of the backend and frontend. Build-only
dependencies are listed in `package.json` / `package-lock.json` and are not part of
the distributed application.

The Docker image additionally contains Debian packages (including LibreOffice,
ffmpeg and fonts). Their license texts are installed inside the image under
`/usr/share/doc/<package>/copyright`.

## Icons and fonts

- **Material Design Icons** (`@mdi/font`) — icon fonts and icon data are
  distributed under the Apache License 2.0; the non-font/non-icon code is MIT.
  The collection is published by the Pictogrammers project.
- **Roboto** (`@fontsource/roboto`) — SIL Open Font License 1.1.

Material Design Icons license text:

```text
Pictogrammers Free License
--------------------------

This icon collection is released as free, open source, and GPL friendly by
the [Pictogrammers](http://pictogrammers.com/) icon group. You may use it
for commercial projects, open source projects, or anything really.

# Icons: Apache 2.0 (https://www.apache.org/licenses/LICENSE-2.0)
Some of the icons are redistributed under the Apache 2.0 license. All other
icons are either redistributed under their respective licenses or are
distributed under the Apache 2.0 license.

# Fonts: Apache 2.0 (https://www.apache.org/licenses/LICENSE-2.0)
All web and desktop fonts are distributed under the Apache 2.0 license. Web
and desktop fonts contain some icons that are redistributed under the Apache
2.0 license. All other icons are either redistributed under their respective
licenses or are distributed under the Apache 2.0 license.

# Code: MIT (https://opensource.org/licenses/MIT)
The MIT license applies to all non-font and non-icon files.
```

## Summary by license

| License | Packages |
| --- | ---: |
| (Apache-2.0 AND BSD-3-Clause) | 1 |
| (BSD-2-Clause OR MIT OR Apache-2.0) | 1 |
| (MIT OR WTFPL) | 1 |
| 0BSD | 1 |
| Apache-2.0 | 8 |
| Apache-2.0 AND LGPL-3.0-or-later | 1 |
| BlueOak-1.0.0 | 8 |
| BSD-2-Clause | 1 |
| BSD-3-Clause | 6 |
| ISC | 17 |
| MIT | 168 |
| MPL-2.0 | 2 |
| OFL-1.1 | 1 |

## Packages

| Package | Version | Scope | License |
| --- | --- | --- | --- |
| `@babel/helper-string-parser` | 7.29.7 | Frontend | MIT |
| `@babel/helper-validator-identifier` | 7.29.7 | Frontend | MIT |
| `@babel/parser` | 7.29.8 | Frontend | MIT |
| `@babel/types` | 7.29.8 | Frontend | MIT |
| `@borewit/text-codec` | 0.2.2 | Backend | MIT |
| `@bufbuild/protobuf` | 2.14.0 | Frontend | (Apache-2.0 AND BSD-3-Clause) |
| `@fastify/accept-negotiator` | 2.1.2 | Backend | MIT |
| `@fastify/ajv-compiler` | 4.0.7 | Backend | MIT |
| `@fastify/busboy` | 3.2.4 | Backend | MIT |
| `@fastify/deepmerge` | 3.2.4 | Backend | MIT |
| `@fastify/error` | 4.2.1 | Backend | MIT |
| `@fastify/fast-json-stringify-compiler` | 5.1.1 | Backend | MIT |
| `@fastify/forwarded` | 3.1.2 | Backend | MIT |
| `@fastify/jwt` | 9.1.0 | Backend | MIT |
| `@fastify/merge-json-schemas` | 0.2.2 | Backend | MIT |
| `@fastify/multipart` | 9.4.0 | Backend | MIT |
| `@fastify/proxy-addr` | 5.1.2 | Backend | MIT |
| `@fastify/send` | 4.2.0 | Backend | MIT |
| `@fastify/static` | 8.3.0 | Backend | MIT |
| `@fontsource/roboto` | 5.3.0 | Frontend | OFL-1.1 |
| `@img/sharp-win32-x64` | 0.33.5 | Backend | Apache-2.0 AND LGPL-3.0-or-later |
| `@isaacs/cliui` | 9.0.0 | Backend | BlueOak-1.0.0 |
| `@jridgewell/sourcemap-codec` | 1.6.0 | Frontend | MIT |
| `@lukeed/ms` | 2.0.2 | Backend | MIT |
| `@mdi/font` | 7.4.47 | Frontend | Apache-2.0 |
| `@oxc-project/types` | 0.147.0 | Frontend | MIT |
| `@parcel/watcher` | 2.6.0 | Frontend | MIT |
| `@parcel/watcher-win32-x64` | 2.6.0 | Frontend | MIT |
| `@pinojs/redact` | 0.4.0 | Backend | MIT |
| `@rolldown/binding-win32-x64-msvc` | 1.2.6 | Frontend | MIT |
| `@rolldown/pluginutils` | 1.0.1 | Frontend | MIT |
| `@tokenizer/inflate` | 0.4.1 | Backend | MIT |
| `@tokenizer/token` | 0.3.0 | Backend | MIT |
| `@types/node` | 24.13.3 | Frontend | MIT |
| `@vue/compiler-core` | 3.5.42 | Frontend | MIT |
| `@vue/compiler-dom` | 3.5.42 | Frontend | MIT |
| `@vue/compiler-sfc` | 3.5.42 | Frontend | MIT |
| `@vue/compiler-ssr` | 3.5.42 | Frontend | MIT |
| `@vue/reactivity` | 3.5.42 | Frontend | MIT |
| `@vue/runtime-core` | 3.5.42 | Frontend | MIT |
| `@vue/runtime-dom` | 3.5.42 | Frontend | MIT |
| `@vue/server-renderer` | 3.5.42 | Frontend | MIT |
| `@vue/shared` | 3.5.42 | Frontend | MIT |
| `@vuetify/loader-shared` | 2.1.2 | Frontend | MIT |
| `abstract-logging` | 2.0.1 | Backend | MIT |
| `ajv` | 8.20.0 | Backend | MIT |
| `ajv-formats` | 3.0.1 | Backend | MIT |
| `asn1.js` | 5.4.1 | Backend | MIT |
| `atomic-sleep` | 1.0.0 | Backend | MIT |
| `avvio` | 9.3.1 | Backend | MIT |
| `balanced-match` | 4.0.4 | Backend | MIT |
| `base64-js` | 1.5.1 | Backend | MIT |
| `better-sqlite3` | 12.11.1 | Backend | MIT |
| `bindings` | 1.5.0 | Backend | MIT |
| `bl` | 4.1.0 | Backend | MIT |
| `bn.js` | 4.12.5 | Backend | MIT |
| `brace-expansion` | 5.0.12 | Backend | MIT |
| `buffer` | 5.7.1 | Backend | MIT |
| `chokidar` | 5.0.0 | Frontend | MIT |
| `chownr` | 1.1.4 | Backend | ISC |
| `color` | 4.2.3 | Backend | MIT |
| `color-convert` | 2.0.1 | Backend | MIT |
| `color-name` | 1.1.4 | Backend | MIT |
| `color-string` | 1.9.1 | Backend | MIT |
| `colorjs.io` | 0.7.1 | Frontend | MIT |
| `content-disposition` | 0.5.4 | Backend | MIT |
| `content-type` | 2.1.0 | Backend | MIT |
| `cookie` | 2.0.1 | Backend | MIT |
| `cross-spawn` | 7.0.6 | Backend | MIT |
| `csstype` | 3.2.3 | Frontend | MIT |
| `debug` | 4.4.3 | Backend | MIT |
| `decompress-response` | 6.0.0 | Backend | MIT |
| `deep-extend` | 0.6.0 | Backend | MIT |
| `depd` | 2.0.0 | Backend | MIT |
| `dequal` | 2.0.3 | Backend | MIT |
| `detect-libc` | 2.1.2 | Backend | Apache-2.0 |
| `ecdsa-sig-formatter` | 1.0.11 | Backend | Apache-2.0 |
| `end-of-stream` | 1.4.5 | Backend | MIT |
| `entities` | 7.0.1 | Frontend | BSD-2-Clause |
| `escape-html` | 1.0.3 | Backend | MIT |
| `estree-walker` | 2.0.2 | Frontend | MIT |
| `exifr` | 7.1.3 | Backend | MIT |
| `expand-template` | 2.0.3 | Backend | (MIT OR WTFPL) |
| `fast-decode-uri-component` | 1.0.1 | Backend | MIT |
| `fast-deep-equal` | 3.1.3 | Backend | MIT |
| `fast-json-stringify` | 7.1.3 | Backend | MIT |
| `fast-jwt` | 5.0.6 | Backend | Apache-2.0 |
| `fast-querystring` | 1.1.2 | Backend | MIT |
| `fast-uri` | 3.1.9 | Backend | BSD-3-Clause |
| `fast-uri` | 4.2.3 | Backend | BSD-3-Clause |
| `fastfall` | 1.5.1 | Backend | MIT |
| `fastify` | 5.12.7 | Backend | MIT |
| `fastify-plugin` | 5.1.0 | Backend | MIT |
| `fastparallel` | 2.4.1 | Backend | ISC |
| `fastq` | 1.20.3 | Backend | ISC |
| `fastseries` | 1.7.2 | Backend | ISC |
| `fdir` | 6.5.0 | Frontend | MIT |
| `file-type` | 21.3.4 | Backend | MIT |
| `file-uri-to-path` | 1.0.0 | Backend | MIT |
| `find-my-way` | 9.10.0 | Backend | MIT |
| `foreground-child` | 3.3.1 | Backend | ISC |
| `fs-constants` | 1.0.0 | Backend | MIT |
| `github-from-package` | 0.0.0 | Backend | MIT |
| `glob` | 11.1.0 | Backend | BlueOak-1.0.0 |
| `has-flag` | 4.0.0 | Frontend | MIT |
| `http-errors` | 2.0.1 | Backend | MIT |
| `ieee754` | 1.2.1 | Backend | BSD-3-Clause |
| `immutable` | 5.1.9 | Frontend | MIT |
| `inherits` | 2.0.4 | Backend | ISC |
| `ini` | 1.3.8 | Backend | ISC |
| `ipaddr.js` | 2.5.0 | Backend | MIT |
| `is-arrayish` | 0.3.4 | Backend | MIT |
| `is-extglob` | 2.1.1 | Frontend | MIT |
| `is-glob` | 4.0.3 | Frontend | MIT |
| `isexe` | 2.0.0 | Backend | ISC |
| `jackspeak` | 4.2.3 | Backend | BlueOak-1.0.0 |
| `json-schema-ref-resolver` | 3.0.1 | Backend | MIT |
| `json-schema-traverse` | 1.0.0 | Backend | MIT |
| `light-my-request` | 6.8.0 | Backend | BSD-3-Clause |
| `lightningcss` | 1.33.0 | Frontend | MPL-2.0 |
| `lightningcss-win32-x64-msvc` | 1.33.0 | Frontend | MPL-2.0 |
| `lru-cache` | 11.5.3 | Backend | BlueOak-1.0.0 |
| `magic-string` | 0.30.21 | Frontend | MIT |
| `media-typer` | 2.0.0 | Backend | MIT |
| `mime` | 3.0.0 | Backend | MIT |
| `mimic-response` | 3.1.0 | Backend | MIT |
| `minimalistic-assert` | 1.0.1 | Backend | ISC |
| `minimatch` | 10.2.6 | Backend | BlueOak-1.0.0 |
| `minimist` | 1.2.8 | Backend | MIT |
| `minipass` | 7.1.3 | Backend | BlueOak-1.0.0 |
| `mkdirp-classic` | 0.5.3 | Backend | MIT |
| `mnemonist` | 0.40.6 | Backend | MIT |
| `ms` | 2.1.3 | Backend | MIT |
| `music-metadata` | 11.16.1 | Backend | MIT |
| `nanoid` | 3.3.18 | Frontend | MIT |
| `napi-build-utils` | 2.0.0 | Backend | MIT |
| `node-abi` | 3.101.0 | Backend | MIT |
| `node-addon-api` | 7.1.1 | Frontend | MIT |
| `obliterator` | 2.0.5 | Backend | MIT |
| `on-exit-leak-free` | 2.1.2 | Backend | MIT |
| `once` | 1.4.0 | Backend | ISC |
| `package-json-from-dist` | 1.0.1 | Backend | BlueOak-1.0.0 |
| `path-key` | 3.1.1 | Backend | MIT |
| `path-scurry` | 2.0.2 | Backend | BlueOak-1.0.0 |
| `picocolors` | 1.1.1 | Frontend | ISC |
| `picomatch` | 4.0.7 | Frontend | MIT |
| `pino` | 10.4.0 | Backend | MIT |
| `pino-abstract-transport` | 3.0.0 | Backend | MIT |
| `pino-std-serializers` | 7.1.0 | Backend | MIT |
| `postcss` | 8.5.26 | Frontend | MIT |
| `prebuild-install` | 7.1.3 | Backend | MIT |
| `process-warning` | 5.1.1 | Backend | MIT |
| `pump` | 3.0.4 | Backend | MIT |
| `quick-format-unescaped` | 4.0.4 | Backend | MIT |
| `rc` | 1.2.8 | Backend | (BSD-2-Clause OR MIT OR Apache-2.0) |
| `readable-stream` | 3.6.2 | Backend | MIT |
| `readdirp` | 5.1.1 | Frontend | MIT |
| `real-require` | 1.0.0 | Backend | MIT |
| `require-from-string` | 2.0.2 | Backend | MIT |
| `ret` | 0.5.1 | Backend | MIT |
| `reusify` | 1.1.0 | Backend | MIT |
| `rfdc` | 1.4.1 | Backend | MIT |
| `rolldown` | 1.2.6 | Frontend | MIT |
| `rxjs` | 7.8.2 | Frontend | Apache-2.0 |
| `safe-buffer` | 5.2.1 | Backend | MIT |
| `safe-regex2` | 5.1.2 | Backend | MIT |
| `safe-stable-stringify` | 2.5.0 | Backend | MIT |
| `safer-buffer` | 2.1.2 | Backend | MIT |
| `sass` | 1.103.1 | Frontend | MIT |
| `sass-embedded` | 1.103.1 | Frontend | MIT |
| `sass-embedded-win32-x64` | 1.103.1 | Frontend | MIT |
| `secure-json-parse` | 4.1.1 | Backend | BSD-3-Clause |
| `semver` | 7.8.5 | Backend | ISC |
| `set-cookie-parser` | 3.2.1 | Backend | MIT |
| `setprototypeof` | 1.2.0 | Backend | ISC |
| `sharp` | 0.33.5 | Backend | Apache-2.0 |
| `shebang-command` | 2.0.0 | Backend | MIT |
| `shebang-regex` | 3.0.0 | Backend | MIT |
| `signal-exit` | 4.1.0 | Backend | ISC |
| `simple-concat` | 1.0.1 | Backend | MIT |
| `simple-get` | 4.0.1 | Backend | MIT |
| `simple-swizzle` | 0.2.4 | Backend | MIT |
| `sonic-boom` | 4.2.1 | Backend | MIT |
| `source-map-js` | 1.2.1 | Frontend | BSD-3-Clause |
| `split2` | 4.2.0 | Backend | ISC |
| `statuses` | 2.0.2 | Backend | MIT |
| `steed` | 1.1.3 | Backend | MIT |
| `string_decoder` | 1.3.0 | Backend | MIT |
| `strip-json-comments` | 2.0.1 | Backend | MIT |
| `strtok3` | 10.6.2 | Backend | MIT |
| `supports-color` | 8.1.1 | Frontend | MIT |
| `sync-child-process` | 1.0.2 | Frontend | MIT |
| `sync-message-port` | 1.2.0 | Frontend | MIT |
| `tar-fs` | 2.1.5 | Backend | MIT |
| `tar-stream` | 2.2.0 | Backend | MIT |
| `thread-stream` | 4.2.0 | Backend | MIT |
| `tinyglobby` | 0.2.17 | Frontend | MIT |
| `toad-cache` | 3.7.4 | Backend | MIT |
| `toidentifier` | 1.0.1 | Backend | MIT |
| `token-types` | 6.1.2 | Backend | MIT |
| `tslib` | 2.8.1 | Frontend | 0BSD |
| `tunnel-agent` | 0.6.0 | Backend | Apache-2.0 |
| `typescript` | 5.9.3 | Frontend | Apache-2.0 |
| `uint8array-extras` | 1.6.0 | Backend | MIT |
| `undici-types` | 7.18.2 | Frontend | MIT |
| `upath` | 2.0.1 | Frontend | MIT |
| `util-deprecate` | 1.0.2 | Backend | MIT |
| `varint` | 6.0.0 | Frontend | MIT |
| `vite` | 8.2.2 | Frontend | MIT |
| `vite-plugin-vuetify` | 2.1.3 | Frontend | MIT |
| `vue` | 3.5.42 | Frontend | MIT |
| `vuetify` | 4.1.12 | Frontend | MIT |
| `which` | 2.0.2 | Backend | ISC |
| `win-guid` | 0.2.1 | Backend | MIT |
| `wrappy` | 1.0.2 | Backend | ISC |
| `xtend` | 4.0.2 | Backend | MIT |

## Copyright notices

### (Apache-2.0 AND BSD-3-Clause)

- `@bufbuild/protobuf@2.14.0`

### (BSD-2-Clause OR MIT OR Apache-2.0)

- `rc@1.2.8`

### (MIT OR WTFPL)

- `expand-template@2.0.3` — Copyright (c) 2018 Lars-Magnus Skog / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER

### 0BSD

- `tslib@2.8.1` — Copyright (c) Microsoft Corporation.

### Apache-2.0

- `@mdi/font@7.4.47`
- `detect-libc@2.1.2` — "Licensor" shall mean the copyright owner or entity authorized by / the copyright owner that is granting the License. / copyright notice that is included in or attached to the work (an example is provided in the Appendix below).
- `ecdsa-sig-formatter@1.0.11` — "Licensor" shall mean the copyright owner or entity authorized by / the copyright owner that is granting the License. / copyright notice that is included in or attached to the work (an example is provided in the Appendix below).
- `fast-jwt@5.0.6` — Copyright 2020-2021 nearForm
- `rxjs@7.8.2` — "Licensor" shall mean the copyright owner or entity authorized by / the copyright owner that is granting the License. / copyright notice that is included in or attached to the work (an example is provided in the Appendix below).
- `sharp@0.33.5` — "Licensor" shall mean the copyright owner or entity authorized by the copyright / available under the License, as indicated by a copyright notice that is included / by the copyright owner or by an individual or Legal Entity authorized to submit
- `tunnel-agent@0.6.0` — "Licensor" shall mean the copyright owner or entity authorized by the copyright owner that is granting the License. / "Work" shall mean the work of authorship, whether in Source or Object form, made available under the License, as indicated by a copyright notice that is included in or attached to the work (an example is provided in the Appendix below). / "Contribution" shall mean any work of authorship, including the original version of the Work and any modifications or additions to that Work or Derivative Works thereof, that is intentionally submitted to Licensor for inclusion in the Work by the copyright owner or by an individual or Legal Entity authorized to submit on behalf of the copyright owner. For the purposes of this definition, "submitted" means any form of electronic, verbal, or written communication sent to the Licensor or its representatives, including but not limited to communication on electronic mailing lists, source code control systems, and issue tracking systems that are managed by, or on behalf of, the Licensor for the purpose of discussing and improving the Work, but excluding communication that is conspicuously marked or otherwise designated in writing by the copyright owner as "Not a Contribution."
- `typescript@5.9.3` — "Licensor" shall mean the copyright owner or entity authorized by the copyright owner that is granting the License. / "Work" shall mean the work of authorship, whether in Source or Object form, made available under the License, as indicated by a copyright notice that is included in or attached to the work (an example is provided in the Appendix below). / "Contribution" shall mean any work of authorship, including the original version of the Work and any modifications or additions to that Work or Derivative Works thereof, that is intentionally submitted to Licensor for inclusion in the Work by the copyright owner or by an individual or Legal Entity authorized to submit on behalf of the copyright owner. For the purposes of this definition, "submitted" means any form of electronic, verbal, or written communication sent to the Licensor or its representatives, including but not limited to communication on electronic mailing lists, source code control systems, and issue tracking systems that are managed by, or on behalf of, the Licensor for the purpose of discussing and improving the Work, but excluding communication that is conspicuously marked or otherwise designated in writing by the copyright owner as "Not a Contribution."

### Apache-2.0 AND LGPL-3.0-or-later

- `@img/sharp-win32-x64@0.33.5` — "Licensor" shall mean the copyright owner or entity authorized by the copyright / available under the License, as indicated by a copyright notice that is included / by the copyright owner or by an individual or Legal Entity authorized to submit

### BlueOak-1.0.0

- `@isaacs/cliui@9.0.0` — ## Copyright / copyright in it.
- `glob@11.1.0` — ## Copyright / copyright in it.
- `jackspeak@4.2.3` — ## Copyright / copyright in it.
- `lru-cache@11.5.3` — ## Copyright / copyright in it.
- `minimatch@10.2.6` — ## Copyright / copyright in it.
- `minipass@7.1.3` — ## Copyright / copyright in it.
- `package-json-from-dist@1.0.1` — ## Copyright / copyright in it.
- `path-scurry@2.0.2` — ## Copyright / copyright in it.

### BSD-2-Clause

- `entities@7.0.1` — Copyright (c) Felix Böhm / Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. / Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

### BSD-3-Clause

- `fast-uri@3.1.9` — Copyright (c) 2011-2021, Gary Court until https://github.com/garycourt/uri-js/commit/a1acf730b4bba3f1097c9f52e7d9d3aba8cdcaae / Copyright (c) 2021-present The Fastify team <https://github.com/fastify/fastify#team> / * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
- `fast-uri@4.2.3` — Copyright (c) 2011-2021, Gary Court until https://github.com/garycourt/uri-js/commit/a1acf730b4bba3f1097c9f52e7d9d3aba8cdcaae / Copyright (c) 2021-present The Fastify team <https://github.com/fastify/fastify#team> / * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
- `ieee754@1.2.1` — Copyright 2008 Fair Oaks Labs, Inc. / 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. / 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
- `light-my-request@6.8.0` — Copyright (c) 2012-2014, Walmart / Copyright (c) 2012-2017, Project contributors / Copyright (c) 2017-present The Fastify team <https://github.com/fastify/fastify#team>
- `secure-json-parse@4.1.1` — Copyright (c) 2019, Sideway Inc, and project contributors / Copyright (c) 2019-present The Fastify team <https://github.com/fastify/fastify#team> / 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
- `source-map-js@1.2.1` — Copyright (c) 2009-2011, Mozilla Foundation and contributors / * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. / * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation

### ISC

- `chownr@1.1.4` — Copyright (c) Isaac Z. Schlueter and Contributors / copyright notice and this permission notice appear in all copies.
- `fastparallel@2.4.1` — Copyright (c) 2015, Matteo Collina <matteo.collina@gmail.com> / copyright notice and this permission notice appear in all copies.
- `fastq@1.20.3` — Copyright (c) 2015-2020, Matteo Collina <matteo.collina@gmail.com> / copyright notice and this permission notice appear in all copies.
- `fastseries@1.7.2` — Copyright (c) 2015, Matteo Collina <matteo.collina@gmail.com> / copyright notice and this permission notice appear in all copies.
- `foreground-child@3.3.1` — Copyright (c) 2015-2023 Isaac Z. Schlueter and Contributors / copyright notice and this permission notice appear in all copies.
- `inherits@2.0.4` — Copyright (c) Isaac Z. Schlueter / copyright notice and this permission notice appear in all copies.
- `ini@1.3.8` — Copyright (c) Isaac Z. Schlueter and Contributors / copyright notice and this permission notice appear in all copies.
- `isexe@2.0.0` — Copyright (c) Isaac Z. Schlueter and Contributors / copyright notice and this permission notice appear in all copies.
- `minimalistic-assert@1.0.1` — Copyright 2015 Calvin Metcalf / with or without fee is hereby granted, provided that the above copyright notice
- `once@1.4.0` — Copyright (c) Isaac Z. Schlueter and Contributors / copyright notice and this permission notice appear in all copies.
- `picocolors@1.1.1` — Copyright (c) 2021-2024 Oleksii Raspopov, Kostiantyn Denysov, Anton Verinov / copyright notice and this permission notice appear in all copies.
- `semver@7.8.5` — Copyright (c) Isaac Z. Schlueter and Contributors / copyright notice and this permission notice appear in all copies.
- `setprototypeof@1.2.0` — Copyright (c) 2015, Wes Todd / copyright notice and this permission notice appear in all copies.
- `signal-exit@4.1.0` — Copyright (c) 2015-2023 Benjamin Coe, Isaac Z. Schlueter, and Contributors / that the above copyright notice and this permission notice
- `split2@4.2.0` — Copyright (c) 2014-2018, Matteo Collina <hello@matteocollina.com> / copyright notice and this permission notice appear in all copies.
- `which@2.0.2` — Copyright (c) Isaac Z. Schlueter and Contributors / copyright notice and this permission notice appear in all copies.
- `wrappy@1.0.2` — Copyright (c) Isaac Z. Schlueter and Contributors / copyright notice and this permission notice appear in all copies.

### MIT

- `@babel/helper-string-parser@7.29.7` — Copyright (c) 2014-present Sebastian McKenzie and other contributors / The above copyright notice and this permission notice shall be / NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
- `@babel/helper-validator-identifier@7.29.7` — Copyright (c) 2014-present Sebastian McKenzie and other contributors / The above copyright notice and this permission notice shall be / NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
- `@babel/parser@7.29.8` — Copyright (C) 2012-2014 by various contributors (see AUTHORS) / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@babel/types@7.29.8` — Copyright (c) 2014-present Sebastian McKenzie and other contributors / The above copyright notice and this permission notice shall be / NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
- `@borewit/text-codec@0.2.2` — Copyright © 2025 Borewit / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `@fastify/accept-negotiator@2.1.2` — Copyright (c) 2022-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@fastify/ajv-compiler@4.0.7` — Copyright (c) 2022-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@fastify/busboy@3.2.4` — Copyright Brian White. All rights reserved. / Copyright (c) 2021-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all
- `@fastify/deepmerge@3.2.4` — Copyright (c) 2022-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@fastify/error@4.2.1` — Copyright (c) 2020-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@fastify/fast-json-stringify-compiler@5.1.1` — Copyright (c) 2022-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@fastify/forwarded@3.1.2` — Copyright (c) 2014-2017 Douglas Christopher Wilson / Copyright (c) 2021-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all
- `@fastify/jwt@9.1.0` — Copyright (c) 2017 Fastify / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@fastify/merge-json-schemas@0.2.2` — Copyright (c) 2024-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@fastify/multipart@9.4.0` — Copyright (c) 2017-present The Fastify team / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@fastify/proxy-addr@5.1.2` — Copyright (c) 2014-2016 Douglas Christopher Wilson / Copyright (c) 2021-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all
- `@fastify/send@4.2.0` — Copyright (c) 2012 TJ Holowaychuk / Copyright (c) 2014-2022 Douglas Christopher Wilson / Copyright (c) 2023-present The Fastify team <https://github.com/fastify/fastify#team>
- `@fastify/static@8.3.0` — Copyright (c) 2017-present The Fastify team / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@jridgewell/sourcemap-codec@1.6.0` — Copyright 2024 Justin Ridgewell <justin@ridgewell.name> / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@lukeed/ms@2.0.2` — Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com) / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `@oxc-project/types@0.147.0` — Copyright (c) 2024-present VoidZero Inc. & Contributors / Copyright (c) 2023 Boshen / The above copyright notice and this permission notice shall be included in all
- `@parcel/watcher@2.6.0` — Copyright (c) 2017-present Devon Govett / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@parcel/watcher-win32-x64@2.6.0` — Copyright (c) 2017-present Devon Govett / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@pinojs/redact@0.4.0` — Copyright (c) 2025 pinojs contributors / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@rolldown/binding-win32-x64-msvc@1.2.6`
- `@rolldown/pluginutils@1.0.1` — Copyright (c) 2026-present, rolldown/plugins repository contributors / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@tokenizer/inflate@0.4.1` — Copyright (c) 2024, Borewit / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the / COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
- `@tokenizer/token@0.3.0`
- `@types/node@24.13.3` — Copyright (c) Microsoft Corporation. / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
- `@vue/compiler-core@3.5.42` — Copyright (c) 2018-present, Yuxi (Evan) You / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@vue/compiler-dom@3.5.42` — Copyright (c) 2018-present, Yuxi (Evan) You / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@vue/compiler-sfc@3.5.42` — Copyright (c) 2018-present, Yuxi (Evan) You / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@vue/compiler-ssr@3.5.42` — Copyright (c) 2018-present, Yuxi (Evan) You / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@vue/reactivity@3.5.42` — Copyright (c) 2018-present, Yuxi (Evan) You / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@vue/runtime-core@3.5.42` — Copyright (c) 2018-present, Yuxi (Evan) You / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@vue/runtime-dom@3.5.42` — Copyright (c) 2018-present, Yuxi (Evan) You / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@vue/server-renderer@3.5.42` — Copyright (c) 2018-present, Yuxi (Evan) You / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@vue/shared@3.5.42` — Copyright (c) 2018-present, Yuxi (Evan) You / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `@vuetify/loader-shared@2.1.2` — Copyright (c) 2016-2019 John Jeremy Leider / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `abstract-logging@2.0.1`
- `ajv@8.20.0` — Copyright (c) 2015-2021 Evgeny Poberezkin / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `ajv-formats@3.0.1` — Copyright (c) 2020 Evgeny Poberezkin / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `asn1.js@5.4.1` — Copyright (c) 2017 Fedor Indutny / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `atomic-sleep@1.0.0` — Copyright (c) 2020 David Mark Clements / The above copyright notice and this permission notice shall be included in all / IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
- `avvio@9.3.1` — Copyright (c) 2016-2020 Matteo Collina / Copyright (c) 2020-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all
- `balanced-match@4.0.4` — Original code Copyright Julian Gruber <julian@juliangruber.com> / Port to TypeScript Copyright Isaac Z. Schlueter <i@izs.me> / The above copyright notice and this permission notice shall be included in all
- `base64-js@1.5.1` — Copyright (c) 2014 Jameson Little / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `better-sqlite3@12.11.1` — Copyright (c) 2017 Joshua Wise / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `bindings@1.5.0` — Copyright (c) 2012 Nathan Rajlich &lt;nathan@tootallnate.net&gt; / The above copyright notice and this permission notice shall be / IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
- `bl@4.1.0` — Copyright (c) 2013-2019 bl contributors / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `bn.js@4.12.5` — Copyright Fedor Indutny, 2015. / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `brace-expansion@5.0.12` — Copyright Julian Gruber <julian@juliangruber.com> / TypeScript port Copyright Isaac Z. Schlueter <i@izs.me> / The above copyright notice and this permission notice shall be included in all
- `buffer@5.7.1` — Copyright (c) Feross Aboukhadijeh, and other contributors. / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `chokidar@5.0.0` — Copyright (c) 2012 Paul Miller (https://paulmillr.com), Elan Shanker / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `color@4.2.3` — Copyright (c) 2012 Heather Arthur / The above copyright notice and this permission notice shall be / NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
- `color-convert@2.0.1` — Copyright (c) 2011-2016 Heather Arthur <fayearthur@gmail.com> / The above copyright notice and this permission notice shall be / NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
- `color-name@1.1.4` — Copyright (c) 2015 Dmitry Ivanov / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `color-string@1.9.1` — Copyright (c) 2011 Heather Arthur <fayearthur@gmail.com> / The above copyright notice and this permission notice shall be / NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
- `colorjs.io@0.7.1` — Copyright (c) 2021 Lea Verou, Chris Lilley / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `content-disposition@0.5.4` — Copyright (c) 2014-2017 Douglas Christopher Wilson / The above copyright notice and this permission notice shall be / IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
- `content-type@2.1.0` — Copyright (c) 2015 Douglas Christopher Wilson / The above copyright notice and this permission notice shall be / IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
- `cookie@2.0.1` — Copyright (c) 2012-2014 Roman Shtylman <shtylman@gmail.com> / Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com> / The above copyright notice and this permission notice shall be
- `cross-spawn@7.0.6` — Copyright (c) 2018 Made With MOXY Lda <hello@moxy.studio> / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `csstype@3.2.3` — Copyright (c) 2017-2018 Fredrik Nicol / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `debug@4.4.3` — Copyright (c) 2014-2017 TJ Holowaychuk <tj@vision-media.ca> / Copyright (c) 2018-2021 Josh Junon / The above copyright notice and this permission notice shall be included in all copies or substantial
- `decompress-response@6.0.0` — Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com) / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `deep-extend@0.6.0` — Copyright (c) 2013-2018, Viacheslav Lotsmanov / The above copyright notice and this permission notice shall be included in all / COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
- `depd@2.0.0` — Copyright (c) 2014-2018 Douglas Christopher Wilson / The above copyright notice and this permission notice shall be / IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
- `dequal@2.0.3` — Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com) / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `end-of-stream@1.4.5` — Copyright (c) 2014 Mathias Buus / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `escape-html@1.0.3` — Copyright (c) 2012-2013 TJ Holowaychuk / Copyright (c) 2015 Andreas Lubbe / Copyright (c) 2015 Tiancheng "Timothy" Gu
- `estree-walker@2.0.2` — Copyright (c) 2015-20 [these people](https://github.com/Rich-Harris/estree-walker/graphs/contributors) / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `exifr@7.1.3` — Copyright (c) 2020 Mike Kovařík, Mutiny.cz / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `fast-decode-uri-component@1.0.1` — Copyright (c) 2018 Tomas Della Vedova / Copyright (c) 2017 Justin Ridgewell / Copyright (c) 2008-2009 Bjoern Hoehrmann <bjoern@hoehrmann.de>
- `fast-deep-equal@3.1.3` — Copyright (c) 2017 Evgeny Poberezkin / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `fast-json-stringify@7.1.3` — Copyright (c) 2016-present Matteo Collina / Copyright (c) 2016-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all
- `fast-querystring@1.1.2` — Copyright (c) 2022 Yagiz Nizipli / The above copyright notice and this permission notice / SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
- `fastfall@1.5.1` — Copyright (c) 2015 Matteo Collina / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `fastify@5.12.7` — Copyright (c) 2016-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `fastify-plugin@5.1.0` — Copyright (c) 2017-present The Fastify team / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `fdir@6.5.0` — Copyright 2023 Abdullah Atta / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `file-type@21.3.4` — Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com) / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `file-uri-to-path@1.0.0` — Copyright (c) 2014 Nathan Rajlich <nathan@tootallnate.net> / The above copyright notice and this permission notice shall be / IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
- `find-my-way@9.10.0` — Copyright (c) 2017-2019 Tomas Della Vedova / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `fs-constants@1.0.0` — Copyright (c) 2018 Mathias Buus / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `github-from-package@0.0.0` — The above copyright notice and this permission notice shall be included in all / COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
- `has-flag@4.0.0` — Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `http-errors@2.0.1` — Copyright (c) 2014 Jonathan Ong me@jongleberry.com / Copyright (c) 2016 Douglas Christopher Wilson doug@somethingdoug.com / The above copyright notice and this permission notice shall be included in
- `immutable@5.1.9` — Copyright (c) 2014-present, Lee Byron and other contributors. / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `ipaddr.js@2.5.0` — Copyright (C) 2011-2017 whitequark <whitequark@whitequark.org> / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `is-arrayish@0.3.4` — Copyright (c) 2015 JD Ballard / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `is-extglob@2.1.1` — Copyright (c) 2014-2016, Jon Schlinkert / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `is-glob@4.0.3` — Copyright (c) 2014-2017, Jon Schlinkert. / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `json-schema-ref-resolver@3.0.1` — Copyright (c) 2023-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `json-schema-traverse@1.0.0` — Copyright (c) 2017 Evgeny Poberezkin / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `magic-string@0.30.21` — Copyright 2018 Rich Harris / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `media-typer@2.0.0` — Copyright (c) 2014-2017 Douglas Christopher Wilson / The above copyright notice and this permission notice shall be / IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
- `mime@3.0.0` — Copyright (c) 2010 Benjamin Thomas, Robert Kieffer / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `mimic-response@3.1.0` — Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com) / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `minimist@1.2.8` — The above copyright notice and this permission notice shall be included in all / COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
- `mkdirp-classic@0.5.3` — Copyright (c) 2020 James Halliday (mail@substack.net) and Mathias Buus / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `mnemonist@0.40.6` — Copyright (c) 2016 Guillaume Plique (Yomguithereal) / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `ms@2.1.3` — Copyright (c) 2020 Vercel, Inc. / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `music-metadata@11.16.1` — Copyright © 2026 Borewit / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `nanoid@3.3.18` — Copyright 2017 Andrey Sitnik <andrey@sitnik.ru> / The above copyright notice and this permission notice shall be included in all / COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
- `napi-build-utils@2.0.0` — Copyright (c) 2018 inspiredware / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `node-abi@3.101.0` — Copyright (c) 2016 Lukas Geiger / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `node-addon-api@7.1.1` — Copyright (c) 2017 [Node.js API collaborators](https://github.com/nodejs/node-addon-api#collaborators) / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `obliterator@2.0.5` — Copyright (c) 2017-2021 Guillaume Plique (Yomguithereal) / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `on-exit-leak-free@2.1.2` — Copyright (c) 2021 Matteo Collina / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `path-key@3.1.1` — Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `picomatch@4.0.7` — Copyright (c) 2017-present, Jon Schlinkert. / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `pino@10.4.0` — Copyright (c) 2016-present Matteo Collina, David Mark Clements and the Pino contributors listed at <https://github.com/pinojs/pino#the-team> and in the README file. / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `pino-abstract-transport@3.0.0` — Copyright (c) 2021 pino / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `pino-std-serializers@7.1.0` — Copyright Mateo Collina, David Mark Clements, James Sumners / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `postcss@8.5.26` — Copyright 2013 Andrey Sitnik <andrey@sitnik.es> / The above copyright notice and this permission notice shall be included in all / COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
- `prebuild-install@7.1.3` — Copyright (c) 2015 Mathias Buus / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `process-warning@5.1.1` — Copyright (c) 2020-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `pump@3.0.4` — Copyright (c) 2014 Mathias Buus / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `quick-format-unescaped@4.0.4` — Copyright (c) 2016-2019 David Mark Clements / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `readable-stream@3.6.2` — Copyright Node.js contributors. All rights reserved. / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `readdirp@5.1.1` — Copyright (c) 2012-2019 Thorsten Lorenz, Paul Miller (https://paulmillr.com) / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `real-require@1.0.0` — Copyright (c) 2021 Paolo Insogna and the real-require contributors / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `require-from-string@2.0.2` — Copyright (c) Vsevolod Strukchinsky <floatdrop@gmail.com> (github.com/floatdrop) / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `ret@0.5.1` — Copyright (C) 2011 by fent / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `reusify@1.1.0` — Copyright (c) 2015-2024 Matteo Collina / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `rfdc@1.4.1` — Copyright 2019 "David Mark Clements <david.mark.clements@gmail.com>" / The above copyright notice and this permission notice shall be included in all copies or substantial portions / THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
- `rolldown@1.2.6` — Copyright (c) 2024-present VoidZero Inc. & Contributors / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `safe-buffer@5.2.1` — Copyright (c) Feross Aboukhadijeh / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `safe-regex2@5.1.2` — Copyright (c) 2019-present The Fastify team <https://github.com/fastify/fastify#team> / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `safe-stable-stringify@2.5.0` — Copyright (c) Ruben Bridgewater / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `safer-buffer@2.1.2` — Copyright (c) 2018 Nikita Skovoroda <chalkerx@gmail.com> / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `sass@1.103.1` — Copyright (c) 2016, Google Inc. / The above copyright notice and this permission notice shall be / NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
- `sass-embedded@1.103.1` — Copyright (c) 2019, Google LLC / The above copyright notice and this permission notice shall be / NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
- `sass-embedded-win32-x64@1.103.1`
- `set-cookie-parser@3.2.1` — Copyright (c) 2015 Nathan Friedly <nathan@nfriedly.com> (http://nfriedly.com/) / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `shebang-command@2.0.0` — Copyright (c) Kevin Mårtensson <kevinmartensson@gmail.com> (github.com/kevva) / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `shebang-regex@3.0.0` — Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `simple-concat@1.0.1` — Copyright (c) Feross Aboukhadijeh / The above copyright notice and this permission notice shall be included in all / COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
- `simple-get@4.0.1` — Copyright (c) Feross Aboukhadijeh / The above copyright notice and this permission notice shall be included in all / COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
- `simple-swizzle@0.2.4` — Copyright (c) 2015 Josh Junon / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `sonic-boom@4.2.1` — Copyright (c) 2017 Matteo Collina / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `statuses@2.0.2` — Copyright (c) 2014 Jonathan Ong <me@jongleberry.com> / Copyright (c) 2016 Douglas Christopher Wilson <doug@somethingdoug.com> / The above copyright notice and this permission notice shall be included in
- `steed@1.1.3` — Copyright (c) 2015 Matteo Collina / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `string_decoder@1.3.0` — Copyright Node.js contributors. All rights reserved. / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `strip-json-comments@2.0.1` — Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `strtok3@10.6.2` — Copyright © 2026 Borewit / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `supports-color@8.1.1` — Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com) / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `sync-child-process@1.0.2` — Copyright (c) 2024, Google LLC / The above copyright notice and this permission notice shall be / NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
- `sync-message-port@1.2.0` — Copyright (c) 2024, Google LLC / The above copyright notice and this permission notice shall be / NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
- `tar-fs@2.1.5` — Copyright (c) 2014 Mathias Buus / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `tar-stream@2.2.0` — Copyright (c) 2014 Mathias Buus / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `thread-stream@4.2.0` — Copyright (c) 2021 Matteo Collina / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `tinyglobby@0.2.17` — Copyright (c) 2024 Madeline Gurriarán / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `toad-cache@3.7.4` — Copyright (c) 2023 Igor Savin / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `toidentifier@1.0.1` — Copyright (c) 2016 Douglas Christopher Wilson <doug@somethingdoug.com> / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `token-types@6.1.2` — Copyright © 2026 Borewit / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `uint8array-extras@1.6.0` — Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com) / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `undici-types@7.18.2` — Copyright (c) Matteo Collina and Undici contributors / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `upath@2.0.1` — Copyright(c) 2014-2020 Angelos Pikoulas (agelos.pikoulas@gmail.com) / The above copyright notice and this permission notice shall be / NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
- `util-deprecate@1.0.2` — Copyright (c) 2014 Nathan Rajlich <nathan@tootallnate.net> / The above copyright notice and this permission notice shall be / NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
- `varint@6.0.0`
- `vite@8.2.2` — Copyright (c) 2019-present, VoidZero Inc. and Vite contributors / The above copyright notice and this permission notice shall be included in all / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `vite-plugin-vuetify@2.1.3` — Copyright (c) 2016-2019 John Jeremy Leider / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `vue@3.5.42` — Copyright (c) 2018-present, Yuxi (Evan) You / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `vuetify@4.1.12` — Copyright (c) 2016-now Vuetify, LLC / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
- `win-guid@0.2.1` — Copyright © 2026 Borewit / The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. / THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
- `xtend@4.0.2` — Copyright (c) 2012-2014 Raynos. / The above copyright notice and this permission notice shall be included in / AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER

### MPL-2.0

- `lightningcss@1.33.0` — applicable copyright doctrines of fair use, fair dealing, or other / (including copyright notices, patent notices, disclaimers of warranty, / You may add additional accurate notices of copyright ownership.
- `lightningcss-win32-x64-msvc@1.33.0` — applicable copyright doctrines of fair use, fair dealing, or other / (including copyright notices, patent notices, disclaimers of warranty, / You may add additional accurate notices of copyright ownership.

### OFL-1.1

- `@fontsource/roboto@5.3.0` — Copyright 2011 The Roboto Project Authors (https://github.com/googlefonts/roboto-classic) Roboto-Italic[wdth,wght].ttf: Copyright 2011 The Roboto Project Authors (https://github.com/googlefonts/roboto-classic) / "Font Software" refers to the set of files released by the Copyright / copyright statement(s).

## Full license texts

### (Apache-2.0 AND BSD-3-Clause)

No license text file was found in the package; see the package metadata and upstream repository.

### (BSD-2-Clause OR MIT OR Apache-2.0)

No license text file was found in the package; see the package metadata and upstream repository.

### (MIT OR WTFPL)

Applies to the packages listed above. Representative text from `expand-template@2.0.3`:

```text
The MIT License (MIT)

Copyright (c) 2018 Lars-Magnus Skog

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### 0BSD

Applies to the packages listed above. Representative text from `tslib@2.8.1`:

```text
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```

### Apache-2.0

Applies to the packages listed above. Representative text from `@mdi/font@7.4.47`:

```text
Pictogrammers Free License
--------------------------

This icon collection is released as free, open source, and GPL friendly by
the [Pictogrammers](http://pictogrammers.com/) icon group. You may use it
for commercial projects, open source projects, or anything really.

# Icons: Apache 2.0 (https://www.apache.org/licenses/LICENSE-2.0)
Some of the icons are redistributed under the Apache 2.0 license. All other
icons are either redistributed under their respective licenses or are
distributed under the Apache 2.0 license.

# Fonts: Apache 2.0 (https://www.apache.org/licenses/LICENSE-2.0)
All web and desktop fonts are distributed under the Apache 2.0 license. Web
and desktop fonts contain some icons that are redistributed under the Apache
2.0 license. All other icons are either redistributed under their respective
licenses or are distributed under the Apache 2.0 license.

# Code: MIT (https://opensource.org/licenses/MIT)
The MIT license applies to all non-font and non-icon files.
```

### Apache-2.0 AND LGPL-3.0-or-later

Applies to the packages listed above. Representative text from `@img/sharp-win32-x64@0.33.5`:

```text
Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

"License" shall mean the terms and conditions for use, reproduction, and
distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity authorized by the copyright
owner that is granting the License.

"Legal Entity" shall mean the union of the acting entity and all other entities
that control, are controlled by, or are under common control with that entity.
For the purposes of this definition, "control" means (i) the power, direct or
indirect, to cause the direction or management of such entity, whether by
contract or otherwise, or (ii) ownership of fifty percent (50%) or more of the
outstanding shares, or (iii) beneficial ownership of such entity.

"You" (or "Your") shall mean an individual or Legal Entity exercising
permissions granted by this License.

"Source" form shall mean the preferred form for making modifications, including
but not limited to software source code, documentation source, and configuration
files.

"Object" form shall mean any form resulting from mechanical transformation or
translation of a Source form, including but not limited to compiled object code,
generated documentation, and conversions to other media types.

"Work" shall mean the work of authorship, whether in Source or Object form, made
available under the License, as indicated by a copyright notice that is included
in or attached to the work (an example is provided in the Appendix below).

"Derivative Works" shall mean any work, whether in Source or Object form, that
is based on (or derived from) the Work and for which the editorial revisions,
annotations, elaborations, or other modifications represent, as a whole, an
original work of authorship. For the purposes of this License, Derivative Works
shall not include works that remain separable from, or merely link (or bind by
name) to the interfaces of, the Work and Derivative Works thereof.

"Contribution" shall mean any work of authorship, including the original version
of the Work and any modifications or additions to that Work or Derivative Works
thereof, that is intentionally submitted to Licensor for inclusion in the Work
by the copyright owner or by an individual or Legal Entity authorized to submit
on behalf of the copyright owner. For the purposes of this definition,
"submitted" means any form of electronic, verbal, or written communication sent
to the Licensor or its representatives, including but not limited to
communication on electronic mailing lists, source code control systems, and
issue tracking systems that are managed by, or on behalf of, the Licensor for
the purpose of discussing and improving the Work, but excluding communication
that is conspicuously marked or otherwise designated in writing by the copyright
owner as "Not a Contribution."

"Contributor" shall mean Licensor and any individual or Legal Entity on behalf
of whom a Contribution has been received by Licensor and subsequently
incorporated within the Work.

2. Grant of Copyright License.

Subject to the terms and conditions of this License, each Contributor hereby
grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free,
irrevocable copyright license to reproduce, prepare Derivative Works of,
publicly display, publicly perform, sublicense, and distribute the Work and such
Derivative Works in Source or Object form.

3. Grant of Patent License.

Subject to the terms and conditions of this License, each Contributor hereby
grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free,
irrevocable (except as stated in this section) patent license to make, have
made, use, offer to sell, sell, import, and otherwise transfer the Work, where
such license applies only to those patent claims licensable by such Contributor
that are necessarily infringed by their Contribution(s) alone or by combination
of their Contribution(s) with the Work to which such Contribution(s) was
submitted. If You institute patent litigation against any entity (including a
cross-claim or counterclaim in a lawsuit) alleging that the Work or a
Contribution incorporated within the Work constitutes direct or contributory
patent infringement, then any patent licenses granted to You under this License
for that Work shall terminate as of the date such litigation is filed.

4. Redistribution.

You may reproduce and distribute copies of the Work or Derivative Works thereof
in any medium, with or without modifications, and in Source or Object form,
provided that You meet the following conditions:

You must give any other recipients of the Work or Derivative Works a copy of
this License; and
You must cause any modified files to carry prominent notices stating that You
changed the files; and
You must retain, in the Source form of any Derivative Works that You distribute,
all copyright, patent, trademark, and attribution notices from the Source form
of the Work, excluding those notices that do not pertain to any part of the
Derivative Works; and
If the Work includes a "NOTICE" text file as part of its distribution, then any
Derivative Works that You distribute must include a readable copy of the
attribution notices contained within such NOTICE file, excluding those notices
that do not pertain to any part of the Derivative Works, in at least one of the
following places: within a NOTICE text file distributed as part of the
Derivative Works; within the Source form or documentation, if provided along
with the Derivative Works; or, within a display generated by the Derivative
Works, if and wherever such third-party notices normally appear. The contents of
the NOTICE file are for informational purposes only and do not modify the
License. You may add Your own attribution notices within Derivative Works that
You distribute, alongside or as an addendum to the NOTICE text from the Work,
provided that such additional attribution notices cannot be construed as
modifying the License.
You may add Your own copyright statement to Your modifications and may provide
additional or different license terms and conditions for use, reproduction, or
distribution of Your modifications, or for any such Derivative Works as a whole,
provided Your use, reproduction, and distribution of the Work otherwise complies
with the conditions stated in this License.

5. Submission of Contributions.

Unless You explicitly state otherwise, any Contribution intentionally submitted
for inclusion in the Work by You to the Licensor shall be under the terms and
conditions of this License, without any additional terms or conditions.
Notwithstanding the above, nothing herein shall supersede or modify the terms of
any separate license agreement you may have executed with Licensor regarding
such Contributions.

6. Trademarks.

This License does not grant permission to use the trade names, trademarks,
service marks, or product names of the Licensor, except as required for
reasonable and customary use in describing the origin of the Work and
reproducing the content of the NOTICE file.

7. Disclaimer of Warranty.

Unless required by applicable law or agreed to in writing, Licensor provides the
Work (and each Contributor provides its Contributions) on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied,
including, without limitation, any warranties or conditions of TITLE,
NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A PARTICULAR PURPOSE. You are
solely responsible for determining the appropriateness of using or
redistributing the Work and assume any risks associated with Your exercise of
permissions under this License.

8. Limitation of Liability.

In no event and under no legal theory, whether in tort (including negligence),
contract, or otherwise, unless required by applicable law (such as deliberate
and grossly negligent acts) or agreed to in writing, shall any Contributor be
liable to You for damages, including any direct, indirect, special, incidental,
or consequential damages of any character arising as a result of this License or
out of the use or inability to use the Work (including but not limited to
damages for loss of goodwill, work stoppage, computer failure or malfunction, or
any and all other commercial damages or losses), even if such Contributor has
been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability.

While redistributing the Work or Derivative Works thereof, You may choose to
offer, and charge a fee for, acceptance of support, warranty, indemnity, or
other liability obligations and/or rights consistent with this License. However,
in accepting such obligations, You may act only on Your own behalf and on Your
sole responsibility, not on behalf of any other Contributor, and only if You
agree to indemnify, defend, and hold each Contributor harmless for any liability
incurred by, or claims asserted against, such Contributor by reason of your
accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work

To apply the Apache License to your work, attach the following boilerplate
notice, with the fields enclosed by brackets "[]" replaced with your own
identifying information. (Don't include the brackets!) The text should be
enclosed in the appropriate comment syntax for the file format. We also
recommend that a file or class name and description of purpose be included on
the same "printed page" as the copyright notice for easier identification within
third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### BlueOak-1.0.0

Applies to the packages listed above. Representative text from `@isaacs/cliui@9.0.0`:

```text
Several modules are vendored under `./src`, which are used and
distributed according to their respective licenses, each provided
in the same directory as the code.

Everything else is released under the following license.

----

# Blue Oak Model License

Version 1.0.0

## Purpose

This license gives everyone as much permission to work with
this software as possible, while protecting contributors
from liability.

## Acceptance

In order to receive this license, you must agree to its
rules. The rules of this license are both obligations
under that agreement and conditions to your license.
You must not do anything with this software that triggers
a rule that you cannot or will not follow.

## Copyright

Each contributor licenses you to do everything with this
software that would otherwise infringe that contributor's
copyright in it.

## Notices

You must ensure that everyone who gets a copy of
any part of this software from you, with or without
changes, also gets the text of this license or a link to
<https://blueoakcouncil.org/license/1.0.0>.

## Excuse

If anyone notifies you in writing that you have not
complied with [Notices](#notices), you can keep your
license by taking all practical steps to comply within 30
days after the notice. If you do not do so, your license
ends immediately.

## Patent

Each contributor licenses you to do everything with this
software that would otherwise infringe any patent claims
they can license or become able to license.

## Reliability

No contributor can revoke this license.

## No Liability

**_As far as the law allows, this software comes as is,
without any warranty or condition, and no contributor
will be liable to anyone for any damages related to this
software or this license, under any kind of legal claim._**
```

### BSD-2-Clause

Applies to the packages listed above. Representative text from `entities@7.0.1`:

```text
Copyright (c) Felix Böhm
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### BSD-3-Clause

Applies to the packages listed above. Representative text from `fast-uri@3.1.9`:

```text
Copyright (c) 2011-2021, Gary Court until https://github.com/garycourt/uri-js/commit/a1acf730b4bba3f1097c9f52e7d9d3aba8cdcaae
Copyright (c) 2021-present The Fastify team <https://github.com/fastify/fastify#team>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * The names of any contributors may not be used to endorse or promote
      products derived from this software without specific prior written
      permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS AND CONTRIBUTORS BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

                                  *   *   *

The complete list of contributors can be found at:
- https://github.com/garycourt/uri-js/graphs/contributors
```

### ISC

Applies to the packages listed above. Representative text from `chownr@1.1.4`:

```text
The ISC License

Copyright (c) Isaac Z. Schlueter and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### MIT

Applies to the packages listed above. Representative text from `@babel/helper-string-parser@7.29.7`:

```text
MIT License

Copyright (c) 2014-present Sebastian McKenzie and other contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### MPL-2.0

Applies to the packages listed above. Representative text from `lightningcss@1.33.0`:

```text
Mozilla Public License Version 2.0
==================================

1. Definitions
--------------

1.1. "Contributor"
means each individual or legal entity that creates, contributes to
the creation of, or owns Covered Software.

1.2. "Contributor Version"
means the combination of the Contributions of others (if any) used
by a Contributor and that particular Contributor's Contribution.

1.3. "Contribution"
means Covered Software of a particular Contributor.

1.4. "Covered Software"
means Source Code Form to which the initial Contributor has attached
the notice in Exhibit A, the Executable Form of such Source Code
Form, and Modifications of such Source Code Form, in each case
including portions thereof.

1.5. "Incompatible With Secondary Licenses"
means

(a) that the initial Contributor has attached the notice described
in Exhibit B to the Covered Software; or

(b) that the Covered Software was made available under the terms of
version 1.1 or earlier of the License, but not also under the
terms of a Secondary License.

1.6. "Executable Form"
means any form of the work other than Source Code Form.

1.7. "Larger Work"
means a work that combines Covered Software with other material, in
a separate file or files, that is not Covered Software.

1.8. "License"
means this document.

1.9. "Licensable"
means having the right to grant, to the maximum extent possible,
whether at the time of the initial grant or subsequently, any and
all of the rights conveyed by this License.

1.10. "Modifications"
means any of the following:

(a) any file in Source Code Form that results from an addition to,
deletion from, or modification of the contents of Covered
Software; or

(b) any new file in Source Code Form that contains any Covered
Software.

1.11. "Patent Claims" of a Contributor
means any patent claim(s), including without limitation, method,
process, and apparatus claims, in any patent Licensable by such
Contributor that would be infringed, but for the grant of the
License, by the making, using, selling, offering for sale, having
made, import, or transfer of either its Contributions or its
Contributor Version.

1.12. "Secondary License"
means either the GNU General Public License, Version 2.0, the GNU
Lesser General Public License, Version 2.1, the GNU Affero General
Public License, Version 3.0, or any later versions of those
licenses.

1.13. "Source Code Form"
means the form of the work preferred for making modifications.

1.14. "You" (or "Your")
means an individual or a legal entity exercising rights under this
License. For legal entities, "You" includes any entity that
controls, is controlled by, or is under common control with You. For
purposes of this definition, "control" means (a) the power, direct
or indirect, to cause the direction or management of such entity,
whether by contract or otherwise, or (b) ownership of more than
fifty percent (50%) of the outstanding shares or beneficial
ownership of such entity.

2. License Grants and Conditions
--------------------------------

2.1. Grants

Each Contributor hereby grants You a world-wide, royalty-free,
non-exclusive license:

(a) under intellectual property rights (other than patent or trademark)
Licensable by such Contributor to use, reproduce, make available,
modify, display, perform, distribute, and otherwise exploit its
Contributions, either on an unmodified basis, with Modifications, or
as part of a Larger Work; and

(b) under Patent Claims of such Contributor to make, use, sell, offer
for sale, have made, import, and otherwise transfer either its
Contributions or its Contributor Version.

2.2. Effective Date

The licenses granted in Section 2.1 with respect to any Contribution
become effective for each Contribution on the date the Contributor first
distributes such Contribution.

2.3. Limitations on Grant Scope

The licenses granted in this Section 2 are the only rights granted under
this License. No additional rights or licenses will be implied from the
distribution or licensing of Covered Software under this License.
Notwithstanding Section 2.1(b) above, no patent license is granted by a
Contributor:

(a) for any code that a Contributor has removed from Covered Software;
or

(b) for infringements caused by: (i) Your and any other third party's
modifications of Covered Software, or (ii) the combination of its
Contributions with other software (except as part of its Contributor
Version); or

(c) under Patent Claims infringed by Covered Software in the absence of
its Contributions.

This License does not grant any rights in the trademarks, service marks,
or logos of any Contributor (except as may be necessary to comply with
the notice requirements in Section 3.4).

2.4. Subsequent Licenses

No Contributor makes additional grants as a result of Your choice to
distribute the Covered Software under a subsequent version of this
License (see Section 10.2) or under the terms of a Secondary License (if
permitted under the terms of Section 3.3).

2.5. Representation

Each Contributor represents that the Contributor believes its
Contributions are its original creation(s) or it has sufficient rights
to grant the rights to its Contributions conveyed by this License.

2.6. Fair Use

This License is not intended to limit any rights You have under
applicable copyright doctrines of fair use, fair dealing, or other
equivalents.

2.7. Conditions

Sections 3.1, 3.2, 3.3, and 3.4 are conditions of the licenses granted
in Section 2.1.

3. Responsibilities
-------------------

3.1. Distribution of Source Form

All distribution of Covered Software in Source Code Form, including any
Modifications that You create or to which You contribute, must be under
the terms of this License. You must inform recipients that the Source
Code Form of the Covered Software is governed by the terms of this
License, and how they can obtain a copy of this License. You may not
attempt to alter or restrict the recipients' rights in the Source Code
Form.

3.2. Distribution of Executable Form

If You distribute Covered Software in Executable Form then:

(a) such Covered Software must also be made available in Source Code
Form, as described in Section 3.1, and You must inform recipients of
the Executable Form how they can obtain a copy of such Source Code
Form by reasonable means in a timely manner, at a charge no more
than the cost of distribution to the recipient; and

(b) You may distribute such Executable Form under the terms of this
License, or sublicense it under different terms, provided that the
license for the Executable Form does not attempt to limit or alter
the recipients' rights in the Source Code Form under this License.

3.3. Distribution of a Larger Work

You may create and distribute a Larger Work under terms of Your choice,
provided that You also comply with the requirements of this License for
the Covered Software. If the Larger Work is a combination of Covered
Software with a work governed by one or more Secondary Licenses, and the
Covered Software is not Incompatible With Secondary Licenses, this
License permits You to additionally distribute such Covered Software
under the terms of such Secondary License(s), so that the recipient of
the Larger Work may, at their option, further distribute the Covered
Software under the terms of either this License or such Secondary
License(s).

3.4. Notices

You may not remove or alter the substance of any license notices
(including copyright notices, patent notices, disclaimers of warranty,
or limitations of liability) contained within the Source Code Form of
the Covered Software, except that You may alter any license notices to
the extent required to remedy known factual inaccuracies.

3.5. Application of Additional Terms

You may choose to offer, and to charge a fee for, warranty, support,
indemnity or liability obligations to one or more recipients of Covered
Software. However, You may do so only on Your own behalf, and not on
behalf of any Contributor. You must make it absolutely clear that any
such warranty, support, indemnity, or liability obligation is offered by
You alone, and You hereby agree to indemnify every Contributor for any
liability incurred by such Contributor as a result of warranty, support,
indemnity or liability terms You offer. You may include additional
disclaimers of warranty and limitations of liability specific to any
jurisdiction.

4. Inability to Comply Due to Statute or Regulation
---------------------------------------------------

If it is impossible for You to comply with any of the terms of this
License with respect to some or all of the Covered Software due to
statute, judicial order, or regulation then You must: (a) comply with
the terms of this License to the maximum extent possible; and (b)
describe the limitations and the code they affect. Such description must
be placed in a text file included with all distributions of the Covered
Software under this License. Except to the extent prohibited by statute
or regulation, such description must be sufficiently detailed for a
recipient of ordinary skill to be able to understand it.

5. Termination
--------------

5.1. The rights granted under this License will terminate automatically
if You fail to comply with any of its terms. However, if You become
compliant, then the rights granted under this License from a particular
Contributor are reinstated (a) provisionally, unless and until such
Contributor explicitly and finally terminates Your grants, and (b) on an
ongoing basis, if such Contributor fails to notify You of the
non-compliance by some reasonable means prior to 60 days after You have
come back into compliance. Moreover, Your grants from a particular
Contributor are reinstated on an ongoing basis if such Contributor
notifies You of the non-compliance by some reasonable means, this is the
first time You have received notice of non-compliance with this License
from such Contributor, and You become compliant prior to 30 days after
Your receipt of the notice.

5.2. If You initiate litigation against any entity by asserting a patent
infringement claim (excluding declaratory judgment actions,
counter-claims, and cross-claims) alleging that a Contributor Version
directly or indirectly infringes any patent, then the rights granted to
You by any and all Contributors for the Covered Software under Section
2.1 of this License shall terminate.

5.3. In the event of termination under Sections 5.1 or 5.2 above, all
end user license agreements (excluding distributors and resellers) which
have been validly granted by You or Your distributors under this License
prior to termination shall survive termination.

************************************************************************
* *
* 6. Disclaimer of Warranty *
* ------------------------- *
* *
* Covered Software is provided under this License on an "as is" *
* basis, without warranty of any kind, either expressed, implied, or *
* statutory, including, without limitation, warranties that the *
* Covered Software is free of defects, merchantable, fit for a *
* particular purpose or non-infringing. The entire risk as to the *
* quality and performance of the Covered Software is with You. *
* Should any Covered Software prove defective in any respect, You *
* (not any Contributor) assume the cost of any necessary servicing, *
* repair, or correction. This disclaimer of warranty constitutes an *
* essential part of this License. No use of any Covered Software is *
* authorized under this License except under this disclaimer. *
* *
************************************************************************

************************************************************************
* *
* 7. Limitation of Liability *
* -------------------------- *
* *
* Under no circumstances and under no legal theory, whether tort *
* (including negligence), contract, or otherwise, shall any *
* Contributor, or anyone who distributes Covered Software as *
* permitted above, be liable to You for any direct, indirect, *
* special, incidental, or consequential damages of any character *
* including, without limitation, damages for lost profits, loss of *
* goodwill, work stoppage, computer failure or malfunction, or any *
* and all other commercial damages or losses, even if such party *
* shall have been informed of the possibility of such damages. This *
* limitation of liability shall not apply to liability for death or *
* personal injury resulting from such party's negligence to the *
* extent applicable law prohibits such limitation. Some *
* jurisdictions do not allow the exclusion or limitation of *
* incidental or consequential damages, so this exclusion and *
* limitation may not apply to You. *
* *
************************************************************************

8. Litigation
-------------

Any litigation relating to this License may be brought only in the
courts of a jurisdiction where the defendant maintains its principal
place of business and such litigation shall be governed by laws of that
jurisdiction, without reference to its conflict-of-law provisions.
Nothing in this Section shall prevent a party's ability to bring
cross-claims or counter-claims.

9. Miscellaneous
----------------

This License represents the complete agreement concerning the subject
matter hereof. If any provision of this License is held to be
unenforceable, such provision shall be reformed only to the extent
necessary to make it enforceable. Any law or regulation which provides
that the language of a contract shall be construed against the drafter
shall not be used to construe this License against a Contributor.

10. Versions of the License
---------------------------

10.1. New Versions

Mozilla Foundation is the license steward. Except as provided in Section
10.3, no one other than the license steward has the right to modify or
publish new versions of this License. Each version will be given a
distinguishing version number.

10.2. Effect of New Versions

You may distribute the Covered Software under the terms of the version
of the License under which You originally received the Covered Software,
or under the terms of any subsequent version published by the license
steward.

10.3. Modified Versions

If you create software not governed by this License, and you want to
create a new license for such software, you may create and use a
modified version of this License if you rename the license and remove
any references to the name of the license steward (except to note that
such modified license differs from this License).

10.4. Distributing Source Code Form that is Incompatible With Secondary
Licenses

If You choose to distribute Source Code Form that is Incompatible With
Secondary Licenses under the terms of this version of the License, the
notice described in Exhibit B of this License must be attached.

Exhibit A - Source Code Form License Notice
-------------------------------------------

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.

If it is not possible or desirable to put the notice in a particular
file, then You may include the notice in a location (such as a LICENSE
file in a relevant directory) where a recipient would be likely to look
for such a notice.

You may add additional accurate notices of copyright ownership.

Exhibit B - "Incompatible With Secondary Licenses" Notice
---------------------------------------------------------

This Source Code Form is "Incompatible With Secondary Licenses", as
defined by the Mozilla Public License, v. 2.0.
```

### OFL-1.1

Applies to the packages listed above. Representative text from `@fontsource/roboto@5.3.0`:

```text
Copyright 2011 The Roboto Project Authors (https://github.com/googlefonts/roboto-classic) Roboto-Italic[wdth,wght].ttf: Copyright 2011 The Roboto Project Authors (https://github.com/googlefonts/roboto-classic)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

