#! /bin/bash

npm install --silent --no-progress -g yarn
yarn global add serverless serverless-webpack --silent --no-progress
serverless deploy --stage $env --package \   $CODEBUILD_SRC_DIR/target/$env -v -r us-east-1