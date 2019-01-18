const socket = io();

const client = feathers();

client.configure(feathers.socketio(socket));

// Store login in localStorage
client.configure(feathers.authentication({
  storage: window.localStorage
}));

// -- Templates
// Login screen
const loginHTML = `
  <main class="login">
    <header class="heading">
      <h1>Log in or Signup</h1>
    </header>
    <form class="form">
      <label>
        Email
        <input placeholder="Email address" type="email" name="email">
      </label>
      <label>
        Password
        <input placeholder="Password" type="password" name="password">
      </label>

      <button id="login" type="button">Log in</button>
      <button id="signup" type="button">Sign up and Log in</button>
    </form>
  </main>
`;

// Chat
const chatHTML = `
  <main>
    <header>
      <h2>Chat</h2>
    </header>

    <section>
      <aside>
        <header>
          <h3><span class="user-count">0</span> users</h3>
        </header>
        <ul class="user-list"></ul>
        <footer>
          <button id="logout">Log out</button>
        </footer>
      </aside>

      <main>
        <div class="chat"></div>
        <form id="send-message">
          <label>
            <span class="visually-hidden">Message</span>
            <input type=text"" name="text" id="messageInput">
            <button id="sendMessage" type="submit">Send</button>
          </label>
        </form>
      </main>
    </section>
  </main>
`;

// -- Functions
// Show login
const showLogin = (error = {}) => {
  if (document.querySelectorAll('.login').length) {
    document.querySelector('.heading').insertAdjacentHTML('beforeend', `<p>There was an error: ${error.message}</p>`);
  } else {
    document.getElementById('app').innerHTML = loginHTML
    handleFormSubmit();
  }
};

// Show chat page
const showChat = async () => {
  document.getElementById('app').innerHTML = chatHTML;
  handleFormSubmit();

  // Find first 25 messages and display them latest last
  const messages = await client.service('messages').find({
    query: {
      $sort: { createdAt: -1 },
      $limit: 25
    }
  });

  messages.data.reverse().forEach(addMessage)

  // Find all users
  const users = await client.service('users').find();
  users.data.forEach(addUser);

  // Handle new messages
  document.getElementById('sendMessage').addEventListener('click', async () => {
    const input = document.getElementById('messageInput');
    console.log('Sending message');

    await client.service('messages').create({
      text: input.value
    });

    input.value = '';
  });
};

// Get credentials
const getCredentials = () => {
  const user = {
    email: document.querySelector('[name="email"]').value,
    password: document.querySelector('[name="password"]').value
  };

  return user;
};

// Log in
const login = async credentials => {
  try {
    if (!credentials) {
      await client.authenticate();
    } else {
      // Add strategy
      const payload = Object.assign({ strategy: 'local' }, credentials);

      await client.authenticate(payload);
    }

    // Show chat after user logs in
    showChat();
  } catch (error) {
    showLogin(error);
  }
};

// Add users to list
const addUser = user => {
  const userList = document.querySelector('.user-list');

  if (userList) {
    userList.insertAdjacentHTML('beforeend', `
      <li>
        <article>
          <img src="${user.avatar}" alt="avatar">
          <p>${user.email}</p>
        </article>
      </li>
    `);
  }

  // Update user count
  const userCount = userList.querySelectorAll('li').length;
  document.querySelector('.user-count').innerHTML = userCount;
};

// Add messages
const addMessage = message => {
  const { user = {} } = message;
  const chat = document.querySelector('.chat');
  
  // Sanitize messages - escape HTML chars
  const text = message.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (chat) {
    chat.insertAdjacentHTML('beforeend', `
      <article>
        <img src="${user.avatar}" alt="${user.email}" class="avatar">
        <div class="message">
          <p>${text}</p>
        </div>
        <footer>
          <span class="visually-hidden">Sent on: </span>${moment(message.createdAt).format('MMM Do, hh:mm:ss')}
        </footer>
      </article>
    `);

    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
  }
};

// -- Events
// Click
document.addEventListener('click', async ev => {
  switch (ev.target.id) {
    case 'login': {
      const user = getCredentials();

      await login(user);
      break;
    }

    case 'logout': {
      await client.logout();
      document.getElementById('app').innerHTML = loginHTML;
      break;
    }

    case 'sendMessage': {
      console.log('Sending message');
      break;
    }
  }
});

// Submit
const handleFormSubmit = () => {
  document.querySelectorAll('form').forEach(el => {
    el.addEventListener('submit', (ev) => {
      ev.preventDefault();
      console.log('Prevented form submit');
    });
  });
};


// Listen to channel events
client.service('messages').on('created', addMessage);
client.service('users').on('created', addUser);

login(); // Attempt to automatically log in