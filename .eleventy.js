const { DateTime } = require("luxon");
// const CleanCSS = require("clean-css");
const UglifyJS = require("uglify-js");
const { minify } = require("html-minifier-terser");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const Image = require("@11ty/eleventy-img");
const slugify = require("slugify");

// 11ty Image
const imageShortcode = async (src, alt, className, widths, formats, sizes) => {
  const metadata = await Image(src, {
    widths: widths || [400, 800, 1280, null],
    formats: formats || ['webp', 'png', null],
    outputDir: "_site/static/img",
    urlPath: "/static/img",
  });

  const imageAttributes = {
    alt,
    class: className,
    sizes: sizes || '100vw',
    loading: 'lazy',
    decoding: 'async',
  };

  return Image.generateHTML(metadata, imageAttributes);
};
// end 11ty Image

module.exports = function(eleventyConfig) {

  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
  eleventyConfig.addLiquidShortcode("image", imageShortcode);
  eleventyConfig.addJavaScriptFunction("image", imageShortcode);

  // Eleventy Navigation https://www.11ty.dev/docs/plugins/navigation/
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  eleventyConfig.addFilter("slug", (str) => {
    return slugify(str, {
      lower: true,
      strict: true,
      replacement: "-"
    });
  });

  // Reading time
  eleventyConfig.addFilter("readingTime", (content) => {
    if (!content) return "1 min read";
    const text = typeof content === 'string' ? content : (content.templateContent || content.content || '');
    if (!text) return "1 min read";
    const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  });

  // Configuration API: use eleventyConfig.addLayoutAlias(from, to) to add
  // layout aliases! Say you have a bunch of existing content using
  // layout: post. If you don’t want to rewrite all of those values, just map
  // post to a new file like this:
  // eleventyConfig.addLayoutAlias("post", "layouts/my_new_post_layout.njk");

  // Merge data instead of overriding
  // https://www.11ty.dev/docs/data-deep-merge/
  eleventyConfig.setDataDeepMerge(true);

  // Add support for maintenance-free post authors
  // Adds an authors collection using the author key in our post frontmatter
  // Thanks to @pdehaan: https://github.com/pdehaan
  eleventyConfig.addCollection("authors", collection => {
    const blogs = collection.getFilteredByGlob("posts/*.md");
    return blogs.reduce((coll, post) => {
      const author = post.data.author;
      if (!author) {
        return coll;
      }
      if (!coll.hasOwnProperty(author)) {
        coll[author] = [];
      }
      coll[author].push(post.data);
      return coll;
    }, {});
  });

  // Date formatting (human readable)
  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj).toFormat("dd LLL yyyy");
  });

  // Date formatting (machine readable)
  eleventyConfig.addFilter("machineDate", dateObj => {
    return DateTime.fromJSDate(dateObj).toFormat("yyyy-MM-dd");
  });

  // Minify CSS
  // eleventyConfig.addFilter("cssmin", function(code) {
  //   return new CleanCSS({}).minify(code).styles;
  // });

  // Minify JS
  eleventyConfig.addFilter("jsmin", function(code) {
    let minified = UglifyJS.minify(code);
    if (minified.error) {
      console.log("UglifyJS error: ", minified.error);
      return code;
    }
    return minified.code;
  });

  // Minify HTML output
  eleventyConfig.addTransform("htmlmin", async function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      return await minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      });
    }
    return content;
  });

  // Don't process folders with static assets e.g. images
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("static/img");
  eleventyConfig.addPassthroughCopy("admin");
  // eleventyConfig.addPassthroughCopy("static/css/style.css");
  // eleventyConfig.addPassthroughCopy("static/css/styles.css");

  /* Markdown Plugins */
  let markdownIt = require("markdown-it");
  let markdownItAnchor = require("markdown-it-anchor");
  let options = {
    html: true,
    breaks: true,
    linkify: true
  };
  let opts = {
    permalink: false
  };

  eleventyConfig.setLibrary("md", markdownIt(options)
    .use(markdownItAnchor, opts)
  );

  return {
    templateFormats: ["md", "njk", "html", "liquid"],

    // If your site lives in a different subdirectory, change this.
    // Leading or trailing slashes are all normalized away, so don’t worry about it.
    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for URLs (it does not affect your file structure)
    pathPrefix: "/",

    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};
