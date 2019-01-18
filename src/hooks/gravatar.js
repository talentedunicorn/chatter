const crypto = require('crypto');

const gravatarUrl = 'https://s.gravatar.com/avatar';
// Set avatar size = 60px
const size = 's=60';

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async context => {
    const { email } = context.data

    // Gravatar uses MD5 hashes from an email address (all lowercase) to get the image
    const hash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
    context.data.avatar = `${gravatarUrl}/${hash}?${size}`;

    return context;
  };
};
