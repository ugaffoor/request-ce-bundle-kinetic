cp ../mb-react-tinymce/library/index.js node_modules/mb-react-tinymce/library/index.js
cp ../react-favicon/dist/index.js node_modules/react-favicon/dist/index.js

export NODE_OPTIONS="--max-old-space-size=10240"
yarn generate-meta-tag
yarn  build
cp ./public/meta.json ./packages/app/build/
