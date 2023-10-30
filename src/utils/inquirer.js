const inquirer = import('inquirer');

module.exports = class Inquirer {
  /**
   * @param {string} name
   * @returns {Promise<string>}
   */
  async promptPassword(name) {
    const prompt = (await inquirer).createPromptModule();
    return new Promise((resolve) => {
      prompt({ type: 'password', name, mask: '*' }).then((d) => {
        resolve(d[name]);
      });
    });
  }
};
