import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { render } from "https://deno.land/x/fresh@1.1.2/src/server/render.ts";

type Message = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

export const handler: Handlers = {
  async GET(req, ctx) {
    const response = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          query GetAllMessages($first: Int!) {
            messageCollection(first: $first) {
              edges {
                node {
                  id
                  author
                  message
                  createdAt
                }
              }
            }
          }
        `,
        variables: {
          first: 10,
        },
      }),
    });

    if (!response.ok) {
      return ctx.render(null);
    }

    const { data } = await response.json();

    return ctx.render(data);
  },
  async POST(req, ctx) {
    const formData = await req.formData();
    const json = Object.fromEntries(formData);

    await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          mutation AddNewMessage($author: String!, $message: String!) {
            messageCreate(input: { author: $author, message: $message}) {
              message {
                id
              }
            }
          }
        `,
        variables: {
          author: json.author,
          message: json.message,
        },
      }),
    });

    const response = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          query GetAllMessages($first: Int!) {
            messageCollection(first: $first) {
              edges {
                node {
                  id
                  author
                  message
                  createdAt
                }
              }
            }
          }
        `,
        variables: {
          first: 10,
        },
      }),
    });

    if (!response.ok) {
      return ctx.render(null);
    }

    const { data } = await response.json();

    return ctx.render(data);
  },
};

export default function Home(
  { data }: PageProps<{ messageCollection: { edges: { node: Message }[] } }>,
) {
  return (
    <>
      <Head>
        <title>Guestbook</title>
      </Head>
      <div class="px-3 py-12 mx-auto max-w-screen-md space-y-6">
        <h1 class="text-5xl font-black">Guestbook</h1>
        <form method="POST">
          <fieldset class="space-y-3">
            <input
              id="author"
              name="author"
              placeholder="Name"
              class="w-full p-3 bg-gray-50 rounded-md focus:outline-none"
            />
            <br />
            <textarea
              id="message"
              name="message"
              placeholder="Write a message..."
              rows={5}
              class="w-full p-3 bg-gray-50 rounded-md focus:outline-none"
            >
            </textarea>
            <br />
            <button
              type="submit"
              class="bg-pink-600 text-white font-black text-center w-full rounded-md focus:outline-none h-12"
            >
              Submit
            </button>
          </fieldset>
        </form>
        <ul class="space-y-3">
          {data?.messageCollection?.edges?.map(({ node }) => (
            <li key={node.id} class="bg-gray-50 p-6 space-y-3 rounded-md">
              <p class="flex items-center justify-between">
                <strong class="text-pink-500">
                  {node.author}
                </strong>
                <small class="text-gray-400">
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(Date.parse(node.createdAt))}
                </small>
              </p>
              <p class="text-gray-900">{node.message}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
