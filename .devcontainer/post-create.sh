#!/usr/bin/env bash
set -e
ni
nr db:migrate
nr db:refresh-all-mat-views
