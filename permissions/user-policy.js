import { rule } from 'graphql-shield';

export const isMyself = rule()(async (parent, args, ctx) => {
  const userId = args.id || args.input.id;
  return userId === ctx.user.id;
});

export default {
  isMyself
};
