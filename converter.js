const fs = require("fs");
const path = require("path");

const prepare_files = (dir, extensions) => {
  let results = {};

  const walk = (current_path) => {
    const files = fs.readdirSync(current_path);

    files.forEach((file) => {
      const file_path = path.join(current_path, file);
      const stat = fs.statSync(file_path);

      if (stat.isDirectory()) {
        walk(file_path);
      } else if (extensions.includes(path.extname(file_path).slice(1))) {
        if (!results[current_path]) {
          results[current_path] = [];
        }
        results[current_path].push(file_path);
      }
    });
  };

  walk(dir);
  return results;
};

const write_output_file = (files_by_directory, output_file_prefix) => {
  const word_threshold = 4000;

  const write_header = (file_path, output_file_path) => {
    const header = `\`\`\`${path.relative("./", file_path)}\n`;
    fs.appendFileSync(output_file_path, header);
  };

  const write_file_content = (file_path, output_file_path) => {
    const content = fs.readFileSync(file_path, "utf-8");

    write_header(file_path, output_file_path);

    let current_word_count = 0;
    let content_to_write = "";
    const content_words = content.split(/\s+/);

    for (const word of content_words) {
      current_word_count++;
      content_to_write += word + " ";

      if (current_word_count >= word_threshold) {
        content_to_write += "\n```\n";
        fs.appendFileSync(output_file_path, content_to_write);
        content_to_write = "";
        current_word_count = 0;
        write_header(file_path, output_file_path);
      }
    }

    if (content_to_write.trim().length) {
      content_to_write += "\n```\n";
      fs.appendFileSync(output_file_path, content_to_write);
    }
  };

  for (const directory in files_by_directory) {
    const file_paths = files_by_directory[directory];
    const output_file_name = `${output_file_prefix}-${directory.replace(/[\\\/]/g, '-')}.txt`;

    file_paths.forEach((file_path) => {
      write_file_content(file_path, output_file_name);
    });
  }
};

const main = () => {
  const dir = "./docs";
  const extensions = ["rst", "ipynb"];
  const output_file_prefix = "output-file";

  const files_by_directory = prepare_files(dir, extensions);
  write_output_file(files_by_directory, output_file_prefix);
};

main();
