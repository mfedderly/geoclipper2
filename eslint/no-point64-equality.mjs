import { ESLintUtils } from "@typescript-eslint/utils";

// 1. Create the rule creator
const createRule = ESLintUtils.RuleCreator(
  (name) => `https://example.com/rule/${name}`,
);

export const rule = createRule({
  create(context) {
    return {
      // 2. Target BinaryExpressions (===, !==, ==, !=)
      BinaryExpression(node) {
        if (!["===", "!==", "==", "!="].includes(node.operator)) {
          return;
        }

        // 3. Get Parser Services to access the Type Checker
        const services = ESLintUtils.getParserServices(context);
        const checker = services.program.getTypeChecker();

        // 4. Helper to check if a type is "Point64"
        function isPoint64(node) {
          const tsNode = services.esTreeNodeToTSNodeMap.get(node);
          const type = checker.getTypeAtLocation(tsNode);

          // Check the type name, alias, or symbol name
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const typeName =
            type.aliasSymbol?.name ??
            type.getSymbol()?.name ??
            type.intrinsicName;

          // You might also want to check if it matches your specific Point64 definition
          return typeName === "Point64";
        }

        // 5. Check Left and Right operands
        const isLeftPoint = isPoint64(node.left);
        const isRightPoint = isPoint64(node.right);

        if (isLeftPoint || isRightPoint) {
          context.report({
            node,
            messageId: "usePoint64Equal",
            data: {
              operator: node.operator,
            },
          });
        }
      },
    };
  },
  name: "no-point64-equality",
  meta: {
    docs: {
      description: "Disallow direct comparison of Point64 types",
    },
    messages: {
      usePoint64Equal:
        'Do not compare Point64 using "{{operator}}". Use point64Equal() instead.',
    },
    type: "problem",
    schema: [],
  },
  defaultOptions: [],
});
