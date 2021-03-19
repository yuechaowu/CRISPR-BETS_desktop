

set -ex



exonerate 2>&1 | grep "exonerate: A generic sequence comparison tool"
exit 0
