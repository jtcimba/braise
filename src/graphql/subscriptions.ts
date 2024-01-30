/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateUser = /* GraphQL */ `subscription OnCreateUser(
  $id: Int
  $email: String
  $last_name: String
  $sub: String
  $first_name: String
) {
  onCreateUser(
    id: $id
    email: $email
    last_name: $last_name
    sub: $sub
    first_name: $first_name
  ) {
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
` as GeneratedSubscription<
  APITypes.OnCreateUserSubscriptionVariables,
  APITypes.OnCreateUserSubscription
>;
export const onUpdateUser = /* GraphQL */ `subscription OnUpdateUser(
  $id: Int
  $email: String
  $last_name: String
  $sub: String
  $first_name: String
) {
  onUpdateUser(
    id: $id
    email: $email
    last_name: $last_name
    sub: $sub
    first_name: $first_name
  ) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateUserSubscriptionVariables,
  APITypes.OnUpdateUserSubscription
>;
export const onDeleteUser = /* GraphQL */ `subscription OnDeleteUser(
  $id: Int
  $email: String
  $last_name: String
  $sub: String
  $first_name: String
) {
  onDeleteUser(
    id: $id
    email: $email
    last_name: $last_name
    sub: $sub
    first_name: $first_name
  ) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteUserSubscriptionVariables,
  APITypes.OnDeleteUserSubscription
>;
export const onCreateRecipe = /* GraphQL */ `subscription OnCreateRecipe(
  $id: Int
  $description: String
  $created_at: String
  $owner: Int
  $duration: Int
) {
  onCreateRecipe(
    id: $id
    description: $description
    created_at: $created_at
    owner: $owner
    duration: $duration
  ) {
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
` as GeneratedSubscription<
  APITypes.OnCreateRecipeSubscriptionVariables,
  APITypes.OnCreateRecipeSubscription
>;
export const onUpdateRecipe = /* GraphQL */ `subscription OnUpdateRecipe(
  $id: Int
  $description: String
  $created_at: String
  $owner: Int
  $duration: Int
) {
  onUpdateRecipe(
    id: $id
    description: $description
    created_at: $created_at
    owner: $owner
    duration: $duration
  ) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateRecipeSubscriptionVariables,
  APITypes.OnUpdateRecipeSubscription
>;
export const onDeleteRecipe = /* GraphQL */ `subscription OnDeleteRecipe(
  $id: Int
  $description: String
  $created_at: String
  $owner: Int
  $duration: Int
) {
  onDeleteRecipe(
    id: $id
    description: $description
    created_at: $created_at
    owner: $owner
    duration: $duration
  ) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteRecipeSubscriptionVariables,
  APITypes.OnDeleteRecipeSubscription
>;
