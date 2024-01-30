/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createUser = /* GraphQL */ `mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateUserMutationVariables,
  APITypes.CreateUserMutation
>;
export const updateUser = /* GraphQL */ `mutation UpdateUser(
  $input: UpdateUserInput!
  $condition: TableUserConditionInput
) {
  updateUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateUserMutationVariables,
  APITypes.UpdateUserMutation
>;
export const deleteUser = /* GraphQL */ `mutation DeleteUser(
  $input: DeleteUserInput!
  $condition: TableUserConditionInput
) {
  deleteUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteUserMutationVariables,
  APITypes.DeleteUserMutation
>;
export const createRecipe = /* GraphQL */ `mutation CreateRecipe($input: CreateRecipeInput!) {
  createRecipe(input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateRecipeMutationVariables,
  APITypes.CreateRecipeMutation
>;
export const updateRecipe = /* GraphQL */ `mutation UpdateRecipe(
  $input: UpdateRecipeInput!
  $condition: TableRecipeConditionInput
) {
  updateRecipe(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateRecipeMutationVariables,
  APITypes.UpdateRecipeMutation
>;
export const deleteRecipe = /* GraphQL */ `mutation DeleteRecipe(
  $input: DeleteRecipeInput!
  $condition: TableRecipeConditionInput
) {
  deleteRecipe(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteRecipeMutationVariables,
  APITypes.DeleteRecipeMutation
>;
