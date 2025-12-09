#!/bin/bash
echo " Code Archaeologist - Setup Test" 🧪
echo "=================================="
echo ""
# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'
check() {
 if [ $? -eq 0 ]; then
 echo -e " ${GREEN} ${NC} $1" ✓
 else
 echo -e " ${RED} ${NC} $1" ✗
 fi
}
# Prerequisites
echo " Prerequisites:" 📦
node --version > /dev/null 2>&1; check "Node.js $(node --version 2>/dev/null)"
pnpm --version > /dev/null 2>&1; check "pnpm $(pnpm --version 2>/dev/null)"
python3 --version > /dev/null 2>&1; check "Python $(python3 --version
2>/dev/null | cut -d' ' -f2)"
git --version > /dev/null 2>&1; check "Git $(git --version 2>/dev/null | cut -d'
' -f3)"
docker --version > /dev/null 2>&1; check "Docker"
# Environment
echo ""
echo " Environment:" 🔑
if [ -f .env ]; then
 check ".env file exists"
 if grep -q "GOOGLE_AI_API_KEY=." .env && ! grep -q
"GOOGLE_AI_API_KEY=$" .env; then
 check "Gemini API key configured"
 else
 echo -e " ${YELLOW} ${NC} Gemini API key not set" ⚠️
 fi
 if grep -q "GITHUB_TOKEN=." .env && ! grep -q "GITHUB_TOKEN=$" .env; then
 check "GitHub token configured"
 else
 echo -e " ${YELLOW} ${NC} GitHub token not set" ⚠️
 fi
else
 echo -e " ${RED} ${NC} .env file not found" ✗
fi
# Project structure
echo ""
echo " Project Structure:" 📁
for dir in src/lib src/agents src/orchestration src/ui; do
 [ -d "$dir" ] && check "Directory: $dir" || echo -e " ${RED} ${NC} Missing: ✗
$dir"
done
# Core files
echo ""
echo " Core Files:" 📄
for file in src/lib/gemini-client.ts src/agents/excavator.ts
src/orchestration/kestra-client.ts; do
 [ -f "$file" ] && check "File: $file" || echo -e " ${RED} ${NC} Missing: ✗
$file"
done
# Dependencies
echo ""
echo " Dependencies:" 📦
[ -d "node_modules" ] && check "node_modules installed" || echo -e " ${YELLOW}
⚠️${NC} Run: pnpm install"
echo ""
echo "=================================="
echo "Run 'pnpm run test:gemini' to test Gemini connection"
echo ""
EOF
chmod +x scripts/test-setup.sh
```
```bash
cat > scripts/quick-start.sh << 'EOF'
#!/bin/bash
echo " Code Archaeologist - Quick Start" 🏛️
echo "===================================="
cd ~/projects/code-archaeologist
# Load environment
if [ -f .env ]; then
 export $(cat .env | grep -v '#' | xargs)
fi
# Check Gemini key
if [ -z "$GOOGLE_AI_API_KEY" ]; then
 echo " GOOGLE_AI_API_KEY not set in .env" ⚠️
 echo " Get your key at: https://aistudio.google.com/"
 exit 1
fi
echo " Gemini API key found" ✅
# Start Docker if needed
if command -v docker &> /dev/null; then
 sudo service docker start 2>/dev/null || true
 echo " Docker service started" ✅
fi
# Test Gemini connection
echo ""
echo " Testing Gemini connection..." 🧪
pnpm run test:gemini
echo ""
echo "===================================="
echo "Quick Start Complete!"
echo ""
echo "Next steps:"
echo " 1. Excavate current directory:"
echo " pnpm run excavate ."
echo ""
echo " 2. Excavate a GitHub repo:"
echo " git clone https://github.com/user/repo /tmp/repo"
echo " pnpm run excavate /tmp/repo"
echo ""
echo " 3. Start Kestra orchestration:"
echo " cd ~/kestra && docker compose up -d"
echo " pnpm run orchestrate init"
echo ""
EOF
chmod +x scripts/quick-start.sh
