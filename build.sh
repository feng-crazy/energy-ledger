#!/bin/bash

SKIP_SKIA_DOWNLOAD=true http_proxy=http://127.0.0.1:7890 https_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7890 eas build --profile preview --platform android --local --non-interactive


http_proxy=http://127.0.0.1:7890 https_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7890 eas build --profile production --platform android --local --non-interactive