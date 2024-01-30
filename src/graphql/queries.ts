/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getUser = /* GraphQL */ `query GetUser($id: Int!) {
  getUser(id: $id) {
    id
    email
    last_name
    sub
    first_name
    password
    created_at
    __typename
  }
}
` as GeneratedQuery<APITypes.GetUserQueryVariables, APITypes.GetUserQuery>;
export const listUsers = /* GraphQL */ `query ListUsers(
  $filter: TableUserFilterInput
  $limit: Int
  $orderBy: [OrderByUserInput]
  $nextToken: String
) {
  listUsers(
    filter: $filter
    limit: $limit
    orderBy: $orderBy
    nextToken: $nextToken
  ) {
    items {
      id
      email
      last_name
      sub
      first_name
      password
      created_at
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListUsersQueryVariables, APITypes.ListUsersQuery>;
export const getRecipe = /* GraphQL */ `query GetRecipe($id: Int!) {
  getRecipe(id: $id) {
    id
    description
    created_at
    owner
    duration
    updated_at
    title
    source
    instructions
    servings
    notes
    ingredients
    __typename
  }
}
` as GeneratedQuery<APITypes.GetRecipeQueryVariables, APITypes.GetRecipeQuery>;
export const listRecipes = /* GraphQL */ `query ListRecipes(
  $filter: TableRecipeFilterInput
  $limit: Int
  $orderBy: [OrderByRecipeInput]
  $nextToken: String
) {
  listRecipes(
    filter: $filter
    limit: $limit
    orderBy: $orderBy
    nextToken: $nextToken
  ) {
    items {
      id
      description
      created_at
      owner
      duration
      updated_at
      title
      source
      instructions
      servings
      notes
      ingredients
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListRecipesQueryVariables,
  APITypes.ListRecipesQuery
>;
