import React, {useState, useEffect} from 'react';
import Router from 'next/router';
import {Formik, Form} from 'formik';
import {Persist} from 'formik-persist';
import {request} from 'graphql-request';
import * as Yup from 'yup';

// Import components
import SelectGroup from './select-group';
import TypeSelect from './type-select';
import SizeSelect from './size-select';
import DoughSelect from './dough-select';
import Input from './input';
import TimeSelect from './time-select';
import Submit from './submit';

// Validation
const OrderSchema = Yup.object().shape({
	type: Yup.string()
		.required('Required!'),
	size: Yup.string()
		.required('Required!'),
	dough: Yup.string()
		.required('Required!'),
	name: Yup.string()
		.min(2, 'Too Short!')
		.max(50, 'Too Long!')
		// Regex for checking full name, https://stackoverflow.com/a/45871742
		.matches(/^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/, 'Invalid name!'),
	phone: Yup.string()
		// Regular expression for checking Polish phone numbers, https://github.com/skotniczny/phonePL
		.matches(/^(?:(?:(?:\+|00)?48)|(?:\(\+?48\)))?(?:1[2-8]|2[2-69]|3[2-49]|4[1-68]|5\d|6[0-35-9]|[7-8][1-9]|9[145])\d{7}$/, 'Invalid phone number!'),
	city: Yup.string()
		.min(2, 'Too Short!')
		.max(50, 'Too Long!'),
	street: Yup.string()
		.min(2, 'Too Short!')
		.max(50, 'Too Long!')
});

const OrderPlacementForm = () => {
	const [skeleton, setSkeleton] = useState('bp3-skeleton');

	useEffect(() => {
		setSkeleton('');
	}, []);

	return (
		<Formik
			initialValues={{
				type: '',
				size: '',
				dough: '',
				name: '',
				phone: '',
				city: '',
				street: '',
				time: ''
			}}
			validationSchema={OrderSchema}
			onSubmit={(values, {setSubmitting, resetForm}) => {
				setTimeout(async () => {
					// Form a GraphQL mutation to create a new order
					const query = `
						mutation {
							createOrder(
								type: "${values.type}"
								size: "${values.size}"
								dough: "${values.dough}"
								name: "${values.name}"
								phone: "${values.phone}"
								time: "${values.time}"
								city: "${values.city}"
								street: "${values.street}"
							) {
								id
							}
						}`;
					await setSubmitting(false);
					// Post a mutation to Prisma and obtain an ID
					await request('http://localhost:4000', query).then(data => {
						const orderID = JSON.stringify(data.createOrder.id);
						// Move user to the thank you page
						Router.push({
							pathname: '/order',
							query: {id: orderID}
						});
					}).catch(error => {
						console.log(error);
					});
					// Call resetForm twice to delete values from localstorage, https://github.com/jaredpalmer/formik-persist/issues/16
					resetForm();
					resetForm();
				}, 500);
			}}
		>
			{({isSubmitting}) => (
				<Form>
					<SelectGroup>
						<TypeSelect className={skeleton}/>
						<SizeSelect className={skeleton}/>
						<DoughSelect className={skeleton}/>
					</SelectGroup>
					<br/>
					<br/>
					<Input className={skeleton} label="Full Name:" type="text" name="name" placeholder="Mark Suckerberg" required/>
					<Input className={skeleton} label="Phone:" type="tel" name="phone" placeholder="666666666" required/>
					<Input className={skeleton} label="City:" type="text" name="city" placeholder="Menlo Park" required/>
					<Input className={skeleton} label="Address:" type="text" name="street" placeholder="1 Hacker Way" required/>
					<br/>
					<TimeSelect className={skeleton}/>
					<br/>
					<br/>
					<Submit className={skeleton} loading={isSubmitting} disabled={isSubmitting}/>
					<Persist name="order-placement-form"/>
				</Form>
			)}
		</Formik>
	);
};

export default OrderPlacementForm;
