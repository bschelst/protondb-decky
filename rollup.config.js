import { readFileSync } from "fs";
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import del from 'rollup-plugin-delete';
import importAssets from 'rollup-plugin-import-assets';
import externalGlobals from 'rollup-plugin-external-globals';

const manifest = JSON.parse(readFileSync("plugin.json", "utf-8"));

// Custom plugin to wrap code in a function and return the plugin
function wrapForDecky() {
    return {
        name: 'wrap-for-decky',
        renderChunk(code) {
            // Remove the ES module export
            code = code.replace(/export\s*\{\s*(\w+)\s+as\s+default\s*\};?/g, '');
            // Wrap in an IIFE that returns the plugin
            return `(function() {\n${code}\nreturn index;\n})()`;
        }
    };
}

export default {
    input: './src/index.tsx',
    plugins: [
        del({ targets: './dist/*', force: true }),
        typescript(),
        json(),
        commonjs(),
        nodeResolve({
            browser: true
        }),
        externalGlobals({
            react: 'SP_REACT',
            'react/jsx-runtime': 'SP_JSX',
            'react-dom': 'SP_REACTDOM',
            '@decky/ui': 'DFL',
            '@decky/manifest': JSON.stringify(manifest)
        }),
        replace({
            preventAssignment: false,
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        }),
        importAssets({
            publicPath: `http://127.0.0.1:1337/plugins/${manifest.name}/`
        }),
        wrapForDecky()
    ],
    context: 'window',
    external: ['react', 'react-dom', '@decky/ui'],
    treeshake: {
        pureExternalImports: {
            pure: ['@decky/ui', '@decky/api']
        },
        preset: 'smallest'
    },
    output: {
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
        sourcemapPathTransform: (relativeSourcePath) => relativeSourcePath.replace(/^\.\.\//, `decky://decky/plugin/${encodeURIComponent(manifest.name)}/`),
        exports: 'default'
    },
};
