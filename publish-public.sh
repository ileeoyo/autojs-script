#!/bin/bash
set -e

# 检查是否提供了必需的参数
if [ -z "$1" ]; then
    echo "错误：缺少必需的参数"
    echo "使用方法: $0 <版本描述>"
    echo "示例: $0 '新增功能优化'"
    exit 1
fi

git checkout public-sync
git pull public main
git merge main --squash --no-commit
git commit -m "Release $(date +'%Y%m%d') - $1"
git push public public-sync:main
git checkout main
git merge public-sync --ff-only