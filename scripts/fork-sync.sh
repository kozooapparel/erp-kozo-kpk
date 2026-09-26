#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Logika auto-sync fork RAIDWEAR + penerapan migrasi Supabase.
#
# Kenapa logika tinggal di sini dan bukan di .github/workflows/fork-sync.yml:
# token bawaan GitHub Actions (GITHUB_TOKEN) TIDAK diizinkan GitHub untuk
# membuat/mengubah file di .github/workflows/*. Karena auto-sync melakukan
# `git push` memakai token itu, setiap perubahan pada file workflow di upstream
# akan membuat push ke SEMUA fork ditolak dengan pesan:
#   refusing to allow a GitHub App to create or update workflow ... without
#   workflows permission
# File ini adalah file biasa, jadi ia bebas berubah lewat auto-sync itu sendiri.
#
# Dipanggil oleh .github/workflows/fork-sync.yml.
#
# Env yang dipakai:
#   UPSTREAM_REPO            default raidwear/raidwear
#   DEFAULT_BRANCH           default master
#   MARK_ALL_AS_APPLIED      'true' untuk menandai semua migrasi sebagai applied
#   SUPABASE_PROJECT_REF     ref project Supabase (kosong = migrasi di-skip)
#   SUPABASE_ACCESS_TOKEN    dibaca langsung oleh Supabase CLI
#   SUPABASE_DB_PASSWORD     dibaca langsung oleh Supabase CLI
# ---------------------------------------------------------------------------
set -euo pipefail

# Jalankan dari salinan sendiri. Langkah `git merge` di bawah bisa mengganti
# isi file ini di tengah eksekusi, sedangkan bash membaca file skrip bertahap.
# Menjalankan dari salinan membuat eksekusi tidak terpengaruh.
if [ "${FORK_SYNC_SNAPSHOT:-}" != '1' ]; then
  _snap_dir="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
  _snap="$(mktemp "${_snap_dir%/}/fork-sync.XXXXXX.sh")"
  cp -- "$0" "$_snap"
  FORK_SYNC_SNAPSHOT=1 exec bash "$_snap" "$@"
fi

UPSTREAM_REPO="${UPSTREAM_REPO:-raidwear/raidwear}"
DEFAULT_BRANCH="${DEFAULT_BRANCH:-master}"
MARK_ALL_AS_APPLIED="${MARK_ALL_AS_APPLIED:-false}"

say() { printf '%s\n' "$*"; }
warn() { printf '::warning::%s\n' "$*"; }
fail() { printf '::error::%s\n' "$*"; }

# ---------------------------------------------------------------------------
# 1. Sinkronkan kode fork dengan upstream
# ---------------------------------------------------------------------------
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'

if ! git remote get-url upstream >/dev/null 2>&1; then
  git remote add upstream "https://github.com/${UPSTREAM_REPO}.git"
fi
git fetch --no-tags upstream "$DEFAULT_BRANCH"

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "upstream/${DEFAULT_BRANCH}")"

if [ "$LOCAL" = "$REMOTE" ]; then
  say 'Kode fork sudah sama dengan upstream.'
else
  say 'Ada update dari upstream:'
  git log --oneline "${LOCAL}..${REMOTE}"

  if ! git merge --ff-only "upstream/${DEFAULT_BRANCH}"; then
    fail 'Fork ini sudah diverge dari upstream karena ada commit lokal.'
    fail 'Auto-sync menolak menimpa perubahanmu. Selesaikan dulu commit lokal,'
    fail "atau reset fork ke upstream/${DEFAULT_BRANCH}, lalu jalankan ulang workflow ini."
    exit 1
  fi

  if git push origin "$DEFAULT_BRANCH"; then
    say 'Fork berhasil disinkronkan. Vercel akan auto-deploy dari push ini.'
  else
    # Umumnya terjadi bila upstream mengubah file di .github/workflows/*.
    # Kalau begitu, kode hasil merge tetap dipakai untuk langkah migrasi di
    # bawah, jadi database tetap ter-update meski push kode ditolak.
    warn 'Push fork ke GitHub ditolak. Biasanya karena upstream mengubah file di .github/workflows/*.'
    warn 'Kode hasil merge di runner ini tetap dipakai, dan migrasi database tetap diterapkan.'
    warn 'Perbaikan sekali saja: buka fork di GitHub, klik "Sync fork", lalu jalankan ulang workflow ini.'
  fi
fi

# ---------------------------------------------------------------------------
# 2. Terapkan migrasi ke database fork
# ---------------------------------------------------------------------------
if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  warn 'SUPABASE_PROJECT_REF belum diisi di fork ini, jadi migrasi database di-skip.'
  warn 'Isi secret SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, dan SUPABASE_DB_PASSWORD'
  warn 'di Settings > Secrets and variables > Actions, lalu jalankan ulang workflow ini.'
  exit 0
fi

if ! command -v supabase >/dev/null 2>&1; then
  fail 'Supabase CLI tidak ditemukan padahal SUPABASE_PROJECT_REF sudah diisi.'
  fail 'Workflow seharusnya menyiapkannya lewat step "Setup Supabase CLI".'
  exit 1
fi

# Dipakai SEKALI untuk database lama yang skemanya dibuat manual lewat SQL editor.
# Jangan dipakai untuk database baru/kosong: versi yang ditandai "applied" tidak
# akan pernah dijalankan lagi.
if [ "$MARK_ALL_AS_APPLIED" = 'true' ]; then
  VERSIONS="$(ls supabase/migrations | sed -E 's/^([0-9]{14}).*/\1/' | sort)"
  say 'Versi yang ditandai applied:'
  say "$VERSIONS"
  # shellcheck disable=SC2086
  supabase migration repair --project-ref "$SUPABASE_PROJECT_REF" --status applied --yes $VERSIONS
fi

# db push hanya menerapkan versi yang belum tercatat di riwayat database, jadi
# aman dijalankan setiap hari: tidak melakukan apa-apa bila sudah up to date.
supabase db push --project-ref "$SUPABASE_PROJECT_REF" --dry-run
supabase db push --project-ref "$SUPABASE_PROJECT_REF"

say 'Selesai.'
