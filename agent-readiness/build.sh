#!/usr/bin/env sh
set -eu
task_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
python3 "$task_dir/unpack_site.py"
python3 "$task_dir/compile_worker.py"
python3 "$task_dir/verify.py"
