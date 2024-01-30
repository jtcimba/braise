/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateUserInput = {
  id: number,
  email?: string | null,
  last_name?: string | null,
  sub?: string | null,
  first_name?: string | null,
  password?: string | null,
  created_at: string,
};

export type User = {
  __typename: "User",
  id: number,
  email?: string | null,
  last_name?: string | null,
  sub?: string | null,
  first_name?: string | null,
  password?: string | null,
  created_at: string,
};

export type UpdateUserInput = {
  id: number,
  email?: string | null,
  last_name?: string | null,
  sub?: string | null,
  first_name?: string | null,
  password?: string | null,
  created_at?: string | null,
};

export type TableUserConditionInput = {
  email?: TableStringFilterInput | null,
  last_name?: TableStringFilterInput | null,
  sub?: TableStringFilterInput | null,
  first_name?: TableStringFilterInput | null,
  password?: TableStringFilterInput | null,
  created_at?: TableStringFilterInput | null,
  and?: Array< TableUserConditionInput | null > | null,
  or?: Array< TableUserConditionInput | null > | null,
  not?: Array< TableUserConditionInput | null > | null,
};

export type TableStringFilterInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  size?: ModelSizeInput | null,
};

export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type DeleteUserInput = {
  id: number,
};

export type CreateRecipeInput = {
  id: number,
  description?: string | null,
  created_at: string,
  owner?: number | null,
  duration?: number | null,
  updated_at: string,
  title?: string | null,
  source?: string | null,
  instructions?: string | null,
  servings?: string | null,
  notes?: string | null,
  ingredients?: string | null,
};

export type Recipe = {
  __typename: "Recipe",
  id: number,
  description?: string | null,
  created_at: string,
  owner?: number | null,
  duration?: number | null,
  updated_at: string,
  title?: string | null,
  source?: string | null,
  instructions?: string | null,
  servings?: string | null,
  notes?: string | null,
  ingredients?: string | null,
};

export type UpdateRecipeInput = {
  id: number,
  description?: string | null,
  created_at?: string | null,
  owner?: number | null,
  duration?: number | null,
  updated_at?: string | null,
  title?: string | null,
  source?: string | null,
  instructions?: string | null,
  servings?: string | null,
  notes?: string | null,
  ingredients?: string | null,
};

export type TableRecipeConditionInput = {
  description?: TableStringFilterInput | null,
  created_at?: TableStringFilterInput | null,
  owner?: TableIntFilterInput | null,
  duration?: TableIntFilterInput | null,
  updated_at?: TableStringFilterInput | null,
  title?: TableStringFilterInput | null,
  source?: TableStringFilterInput | null,
  instructions?: TableStringFilterInput | null,
  servings?: TableStringFilterInput | null,
  notes?: TableStringFilterInput | null,
  ingredients?: TableStringFilterInput | null,
  and?: Array< TableRecipeConditionInput | null > | null,
  or?: Array< TableRecipeConditionInput | null > | null,
  not?: Array< TableRecipeConditionInput | null > | null,
};

export type TableIntFilterInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
};

export type DeleteRecipeInput = {
  id: number,
};

export type TableUserFilterInput = {
  id?: TableIntFilterInput | null,
  email?: TableStringFilterInput | null,
  last_name?: TableStringFilterInput | null,
  sub?: TableStringFilterInput | null,
  first_name?: TableStringFilterInput | null,
  password?: TableStringFilterInput | null,
  created_at?: TableStringFilterInput | null,
  and?: Array< TableUserFilterInput | null > | null,
  or?: Array< TableUserFilterInput | null > | null,
  not?: Array< TableUserFilterInput | null > | null,
};

export type OrderByUserInput = {
  id?: ModelSortDirection | null,
  email?: ModelSortDirection | null,
  last_name?: ModelSortDirection | null,
  sub?: ModelSortDirection | null,
  first_name?: ModelSortDirection | null,
  password?: ModelSortDirection | null,
  created_at?: ModelSortDirection | null,
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type UserConnection = {
  __typename: "UserConnection",
  items?:  Array<User | null > | null,
  nextToken?: string | null,
};

export type TableRecipeFilterInput = {
  id?: TableIntFilterInput | null,
  description?: TableStringFilterInput | null,
  created_at?: TableStringFilterInput | null,
  owner?: TableIntFilterInput | null,
  duration?: TableIntFilterInput | null,
  updated_at?: TableStringFilterInput | null,
  title?: TableStringFilterInput | null,
  source?: TableStringFilterInput | null,
  instructions?: TableStringFilterInput | null,
  servings?: TableStringFilterInput | null,
  notes?: TableStringFilterInput | null,
  ingredients?: TableStringFilterInput | null,
  and?: Array< TableRecipeFilterInput | null > | null,
  or?: Array< TableRecipeFilterInput | null > | null,
  not?: Array< TableRecipeFilterInput | null > | null,
};

export type OrderByRecipeInput = {
  id?: ModelSortDirection | null,
  description?: ModelSortDirection | null,
  created_at?: ModelSortDirection | null,
  owner?: ModelSortDirection | null,
  duration?: ModelSortDirection | null,
  updated_at?: ModelSortDirection | null,
  title?: ModelSortDirection | null,
  source?: ModelSortDirection | null,
  instructions?: ModelSortDirection | null,
  servings?: ModelSortDirection | null,
  notes?: ModelSortDirection | null,
  ingredients?: ModelSortDirection | null,
};

export type RecipeConnection = {
  __typename: "RecipeConnection",
  items?:  Array<Recipe | null > | null,
  nextToken?: string | null,
};

export type CreateUserMutationVariables = {
  input: CreateUserInput,
};

export type CreateUserMutation = {
  createUser?:  {
    __typename: "User",
    id: number,
    email?: string | null,
    last_name?: string | null,
    sub?: string | null,
    first_name?: string | null,
    password?: string | null,
    created_at: string,
  } | null,
};

export type UpdateUserMutationVariables = {
  input: UpdateUserInput,
  condition?: TableUserConditionInput | null,
};

export type UpdateUserMutation = {
  updateUser?:  {
    __typename: "User",
    id: number,
    email?: string | null,
    last_name?: string | null,
    sub?: string | null,
    first_name?: string | null,
    password?: string | null,
    created_at: string,
  } | null,
};

export type DeleteUserMutationVariables = {
  input: DeleteUserInput,
  condition?: TableUserConditionInput | null,
};

export type DeleteUserMutation = {
  deleteUser?:  {
    __typename: "User",
    id: number,
    email?: string | null,
    last_name?: string | null,
    sub?: string | null,
    first_name?: string | null,
    password?: string | null,
    created_at: string,
  } | null,
};

export type CreateRecipeMutationVariables = {
  input: CreateRecipeInput,
};

export type CreateRecipeMutation = {
  createRecipe?:  {
    __typename: "Recipe",
    id: number,
    description?: string | null,
    created_at: string,
    owner?: number | null,
    duration?: number | null,
    updated_at: string,
    title?: string | null,
    source?: string | null,
    instructions?: string | null,
    servings?: string | null,
    notes?: string | null,
    ingredients?: string | null,
  } | null,
};

export type UpdateRecipeMutationVariables = {
  input: UpdateRecipeInput,
  condition?: TableRecipeConditionInput | null,
};

export type UpdateRecipeMutation = {
  updateRecipe?:  {
    __typename: "Recipe",
    id: number,
    description?: string | null,
    created_at: string,
    owner?: number | null,
    duration?: number | null,
    updated_at: string,
    title?: string | null,
    source?: string | null,
    instructions?: string | null,
    servings?: string | null,
    notes?: string | null,
    ingredients?: string | null,
  } | null,
};

export type DeleteRecipeMutationVariables = {
  input: DeleteRecipeInput,
  condition?: TableRecipeConditionInput | null,
};

export type DeleteRecipeMutation = {
  deleteRecipe?:  {
    __typename: "Recipe",
    id: number,
    description?: string | null,
    created_at: string,
    owner?: number | null,
    duration?: number | null,
    updated_at: string,
    title?: string | null,
    source?: string | null,
    instructions?: string | null,
    servings?: string | null,
    notes?: string | null,
    ingredients?: string | null,
  } | null,
};

export type GetUserQueryVariables = {
  id: number,
};

export type GetUserQuery = {
  getUser?:  {
    __typename: "User",
    id: number,
    email?: string | null,
    last_name?: string | null,
    sub?: string | null,
    first_name?: string | null,
    password?: string | null,
    created_at: string,
  } | null,
};

export type ListUsersQueryVariables = {
  filter?: TableUserFilterInput | null,
  limit?: number | null,
  orderBy?: Array< OrderByUserInput | null > | null,
  nextToken?: string | null,
};

export type ListUsersQuery = {
  listUsers?:  {
    __typename: "UserConnection",
    items?:  Array< {
      __typename: "User",
      id: number,
      email?: string | null,
      last_name?: string | null,
      sub?: string | null,
      first_name?: string | null,
      password?: string | null,
      created_at: string,
    } | null > | null,
    nextToken?: string | null,
  } | null,
};

export type GetRecipeQueryVariables = {
  id: number,
};

export type GetRecipeQuery = {
  getRecipe?:  {
    __typename: "Recipe",
    id: number,
    description?: string | null,
    created_at: string,
    owner?: number | null,
    duration?: number | null,
    updated_at: string,
    title?: string | null,
    source?: string | null,
    instructions?: string | null,
    servings?: string | null,
    notes?: string | null,
    ingredients?: string | null,
  } | null,
};

export type ListRecipesQueryVariables = {
  filter?: TableRecipeFilterInput | null,
  limit?: number | null,
  orderBy?: Array< OrderByRecipeInput | null > | null,
  nextToken?: string | null,
};

export type ListRecipesQuery = {
  listRecipes?:  {
    __typename: "RecipeConnection",
    items?:  Array< {
      __typename: "Recipe",
      id: number,
      description?: string | null,
      created_at: string,
      owner?: number | null,
      duration?: number | null,
      updated_at: string,
      title?: string | null,
      source?: string | null,
      instructions?: string | null,
      servings?: string | null,
      notes?: string | null,
      ingredients?: string | null,
    } | null > | null,
    nextToken?: string | null,
  } | null,
};

export type OnCreateUserSubscriptionVariables = {
  id?: number | null,
  email?: string | null,
  last_name?: string | null,
  sub?: string | null,
  first_name?: string | null,
};

export type OnCreateUserSubscription = {
  onCreateUser?:  {
    __typename: "User",
    id: number,
    email?: string | null,
    last_name?: string | null,
    sub?: string | null,
    first_name?: string | null,
    password?: string | null,
    created_at: string,
  } | null,
};

export type OnUpdateUserSubscriptionVariables = {
  id?: number | null,
  email?: string | null,
  last_name?: string | null,
  sub?: string | null,
  first_name?: string | null,
};

export type OnUpdateUserSubscription = {
  onUpdateUser?:  {
    __typename: "User",
    id: number,
    email?: string | null,
    last_name?: string | null,
    sub?: string | null,
    first_name?: string | null,
    password?: string | null,
    created_at: string,
  } | null,
};

export type OnDeleteUserSubscriptionVariables = {
  id?: number | null,
  email?: string | null,
  last_name?: string | null,
  sub?: string | null,
  first_name?: string | null,
};

export type OnDeleteUserSubscription = {
  onDeleteUser?:  {
    __typename: "User",
    id: number,
    email?: string | null,
    last_name?: string | null,
    sub?: string | null,
    first_name?: string | null,
    password?: string | null,
    created_at: string,
  } | null,
};

export type OnCreateRecipeSubscriptionVariables = {
  id?: number | null,
  description?: string | null,
  created_at?: string | null,
  owner?: number | null,
  duration?: number | null,
};

export type OnCreateRecipeSubscription = {
  onCreateRecipe?:  {
    __typename: "Recipe",
    id: number,
    description?: string | null,
    created_at: string,
    owner?: number | null,
    duration?: number | null,
    updated_at: string,
    title?: string | null,
    source?: string | null,
    instructions?: string | null,
    servings?: string | null,
    notes?: string | null,
    ingredients?: string | null,
  } | null,
};

export type OnUpdateRecipeSubscriptionVariables = {
  id?: number | null,
  description?: string | null,
  created_at?: string | null,
  owner?: number | null,
  duration?: number | null,
};

export type OnUpdateRecipeSubscription = {
  onUpdateRecipe?:  {
    __typename: "Recipe",
    id: number,
    description?: string | null,
    created_at: string,
    owner?: number | null,
    duration?: number | null,
    updated_at: string,
    title?: string | null,
    source?: string | null,
    instructions?: string | null,
    servings?: string | null,
    notes?: string | null,
    ingredients?: string | null,
  } | null,
};

export type OnDeleteRecipeSubscriptionVariables = {
  id?: number | null,
  description?: string | null,
  created_at?: string | null,
  owner?: number | null,
  duration?: number | null,
};

export type OnDeleteRecipeSubscription = {
  onDeleteRecipe?:  {
    __typename: "Recipe",
    id: number,
    description?: string | null,
    created_at: string,
    owner?: number | null,
    duration?: number | null,
    updated_at: string,
    title?: string | null,
    source?: string | null,
    instructions?: string | null,
    servings?: string | null,
    notes?: string | null,
    ingredients?: string | null,
  } | null,
};
