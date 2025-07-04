import { Type } from '@sinclair/typebox';

export default async function (app) {
  const AnalyzeCodeIn = Type.Object({
    code: Type.String({
      description: 'Code à analyser',
      examples: ["print('Hello world')"]
    })
  });

  const AnalyzeCodeOut = Type.Object({
    lines: Type.Integer(),
    chars: Type.Integer(),
    is_empty: Type.Boolean()
  });

  app.post('/analyze', {
    schema: {
      body: AnalyzeCodeIn,
      response: { 200: AnalyzeCodeOut },
      tags: ['Analysis']
    }
  }, async (req, reply) => {
    const { code } = req.body;
    reply.send({
      lines: code.split('\n').length,
      chars: code.length,
      is_empty: code.trim().length === 0
    });
  });
}
