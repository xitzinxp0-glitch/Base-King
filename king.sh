clear
echo "King Base - Created by R.Santos; Contato: +5562982053713"
if [ ! -d "node_modules" ]; then
    npm install
fi
node src/connection/king-cn.js
