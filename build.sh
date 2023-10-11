cp ../mb-react-tinymce/library/index.js node_modules/mb-react-tinymce/library/index.js
cp ../XSRF_TOKEN_Hack/react-kinetic-core.js packages/app/node_modules/react-kinetic-core/dist/react-kinetic-core.js
cp ../XSRF_TOKEN_Hack/react-kinetic-core.js packages/services/node_modules/react-kinetic-core/dist/react-kinetic-core.js
cp ../XSRF_TOKEN_Hack/react-kinetic-core.js node_modules/react-kinetic-core/dist/react-kinetic-core.js
cp ../react-cache-buster/dist/CacheBuster.js node_modules/react-cache-buster/dist/CacheBuster.js
cp ../react-cache-buster/dist/CacheBuster.modern.js node_modules/react-cache-buster/dist/CacheBuster.modern.js
cp ../react-cache-buster/dist/index.modern.js node_modules/react-cache-buster/dist/index.modern.js
cp ../react-favicon/dist/index.js node_modules/react-favicon/dist/index.js

yarn generate-meta-tag
yarn  build
cp ./public/meta.json ./packages/app/build/