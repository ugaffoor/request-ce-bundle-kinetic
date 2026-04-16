cp ../mb-react-tinymce/library/index.js node_modules/mb-react-tinymce/library/index.js
cp ../react-favicon/dist/index.js node_modules/react-favicon/dist/index.js

export NODE_OPTIONS="--max-old-space-size=10240"
yarn  build
cp ./public/meta.json ./packages/app/build/

#find packages/app/build/static -name "*.js" -o -name "*.css" | while read f; do
#gzip -9 -k "$f" # creates filename.js.gz alongside filename.js
#done