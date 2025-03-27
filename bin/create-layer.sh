mkdir -p layer/nodejs
cp package.json layer/nodejs/
cd layer/nodejs
npm install --production
cd ..
zip -r nodejs_layer.zip .